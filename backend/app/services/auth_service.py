"""
Authentication and user management business logic service.

Handles:
- Password validation and bcrypt hashing
- Account lockout policy (5 consecutive failures = 15-minute lock)
- Multi-factor authentication (MFA / TOTP)
- Audit event logging on login attempts
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import pyotp
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_event
from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """Retrieve user by primary key."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    """Retrieve user by username."""
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Retrieve user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def authenticate_user(
    db: AsyncSession,
    username: str,
    password: str,
    client_ip: Optional[str] = None,
) -> Tuple[Optional[User], Optional[str]]:
    """
    Authenticate user credentials against DB and enforce lockout policy.

    Returns:
        (user, error_message)
    """
    user = await get_user_by_username(db, username)
    now = datetime.now(timezone.utc)

    if not user:
        await record_audit_event(
            db,
            user_id=None,
            action="LOGIN_ATTEMPT",
            resource="User",
            resource_id=username,
            ip_address=client_ip,
            result="failure",
            detail={"reason": "User not found"},
        )
        return None, "Invalid username or password"

    # Check if account is currently locked
    if user.locked_until and user.locked_until > now:
        remaining_minutes = int((user.locked_until - now).total_seconds() / 60) + 1
        await record_audit_event(
            db,
            user_id=user.id,
            action="LOGIN_LOCKED",
            resource="User",
            resource_id=str(user.id),
            ip_address=client_ip,
            result="failure",
            detail={"locked_until": user.locked_until.isoformat()},
        )
        return None, f"Account is locked due to multiple failed logins. Try again in {remaining_minutes} minutes."

    # Validate password
    if not verify_password(password, user.hashed_password):
        user.failed_attempts += 1
        detail = {"failed_attempts": user.failed_attempts}
        if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            detail["lockout_until"] = user.locked_until.isoformat()

        await db.commit()
        await record_audit_event(
            db,
            user_id=user.id,
            action="LOGIN_FAILED",
            resource="User",
            resource_id=str(user.id),
            ip_address=client_ip,
            result="failure",
            detail=detail,
        )
        return None, "Invalid username or password"

    if not user.is_active:
        return None, "Account is disabled"

    # Reset failure counters on successful password verification
    user.failed_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    await db.commit()

    return user, None


def verify_totp_code(secret: str, code: str) -> bool:
    """Verify a 6-digit TOTP code using the shared secret."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


async def setup_mfa(db: AsyncSession, user: User) -> Tuple[str, str]:
    """
    Generate a new TOTP secret and provisioning URI for the user.
    Does not activate MFA until verified with a token.
    """
    secret = pyotp.random_base32()
    user.mfa_secret = secret
    await db.commit()

    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(
        name=user.email,
        issuer_name=f"{settings.APP_NAME} - Mettu Karl",
    )
    return secret, uri


async def verify_and_enable_mfa(db: AsyncSession, user: User, code: str) -> bool:
    """Validate initial code and turn MFA active."""
    if not user.mfa_secret:
        return False

    if verify_totp_code(user.mfa_secret, code):
        user.is_mfa_enabled = True
        await db.commit()
        return True
    return False


async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Create a new user with hashed password."""
    user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
