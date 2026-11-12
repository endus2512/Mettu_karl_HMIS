"""
Security utilities for authentication and authorization.

Provides:
- JWT token creation and verification (HS256)
- Password hashing and verification with bcrypt
- TOTP-based MFA helpers using pyotp
"""
import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import pyotp
import bcrypt
from cryptography.fernet import Fernet, InvalidToken
from jose import JWTError, jwt

from app.core.config import settings

# Token type constants
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"
STAFF_WAIT_TOKEN_TYPE = "staff_approval_wait"


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    pwd_bytes = plain_password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


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


def create_staff_wait_token(user_id: int, jti: str, expires_minutes: int = 240) -> str:
    """Create a single-use wait token allowing a pending staff applicant to poll approval status."""
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": STAFF_WAIT_TOKEN_TYPE,
        "jti": jti,
        "iat": now,
        "exp": now + timedelta(minutes=expires_minutes),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_staff_wait_token(token: str) -> dict[str, Any]:
    """Decode and validate a pending staff wait token strictly enforcing token type."""
    payload = decode_token(token)
    if payload.get("type") != STAFF_WAIT_TOKEN_TYPE or not payload.get("jti"):
        raise JWTError("Invalid staff verification wait token type")
    return payload


def _credential_vault_fernet() -> Fernet:
    """Derive a dedicated Fernet cipher key from SECRET_KEY for Admin credential recovery."""
    digest = hashlib.sha256(f"{settings.SECRET_KEY}|mkh-credential-vault-v1".encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_credential_vault(plain_password: Optional[str]) -> Optional[str]:
    """Encrypt a user's password into the recoverable Admin credential vault."""
    if not plain_password:
        return None
    return _credential_vault_fernet().encrypt(plain_password.encode("utf-8")).decode("utf-8")


def decrypt_credential_vault(cipher_text: Optional[str]) -> Optional[str]:
    """Decrypt a stored Admin-recoverable credential from the vault, or None if unavailable."""
    if not cipher_text:
        return None
    try:
        return _credential_vault_fernet().decrypt(cipher_text.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        return None
