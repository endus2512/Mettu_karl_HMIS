"""
Security utilities for authentication and authorization.

Provides:
- JWT token creation and verification (HS256)
- Password hashing and verification with bcrypt
- TOTP-based MFA helpers using pyotp
"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import pyotp
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token type constants
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str | Any, extra_claims: dict[str, Any] | None = None) -> str:
    """
    Create a JWT access token.

    Args:
        subject: The token subject (usually user ID or username).
        extra_claims: Optional additional claims to include in the token.

    Returns:
        Encoded JWT string.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": ACCESS_TOKEN_TYPE,
        "iat": now,
        "exp": expire,
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str | Any) -> str:
    """
    Create a JWT refresh token with longer expiry.

    Args:
        subject: The token subject (usually user ID).

    Returns:
        Encoded JWT string.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": REFRESH_TOKEN_TYPE,
        "iat": now,
        "exp": expire,
        "jti": secrets.token_hex(16),  # unique token ID for revocation
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT token.

    Args:
        token: The JWT string to decode.

    Returns:
        The decoded payload dictionary.

    Raises:
        JWTError: If the token is invalid or expired.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def generate_mfa_secret() -> str:
    """Generate a new TOTP secret for MFA setup."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, username: str) -> str:
    """
    Generate a TOTP provisioning URI for QR code generation.

    Args:
        secret: The base32 TOTP secret.
        username: The user's username/email for display in authenticator apps.

    Returns:
        otpauth:// URI string.
    """
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=settings.APP_NAME)


def verify_totp(secret: str, token: str) -> bool:
    """
    Verify a TOTP token against a secret.

    Args:
        secret: The user's base32 TOTP secret.
        token: The 6-digit token from the authenticator app.

    Returns:
        True if the token is valid (allows ±1 window for clock drift).
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)
