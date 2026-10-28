"""
FastAPI dependency injection utilities.

Provides reusable dependencies for:
- Database sessions
- Current user extraction from JWT
- Role-based access control (RBAC)
"""
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.services.auth_service import get_user_by_id

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Extract and validate the current user from the Bearer token.

    Raises:
        HTTPException 401: If the token is missing, invalid, or expired.
        HTTPException 403: If the user account is inactive or locked.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
        user_id_str: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if user_id_str is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user_by_id(db, int(user_id_str))
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )
    return user


def require_roles(*roles: UserRole):
    """
    Dependency factory that enforces role-based access control.

    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(
            _: User = Depends(require_roles(UserRole.ADMIN))
        ):
            ...
    """
    async def _require_roles(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        # SUPER_ADMIN retains global administrative oversight
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user

        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied (Eeyyama hin qabdan). Required roles: {[r.value for r in roles]}. Current role: {current_user.role.value}",
            )
        return current_user

    return _require_roles


# Common RBAC dependency presets
require_admin = require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
require_clinical = require_roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPER_ADMIN)
require_doctor = require_roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN)
require_financial = require_roles(UserRole.ADMIN, UserRole.BILLING, UserRole.INSURANCE_OFFICER, UserRole.SUPER_ADMIN)
require_pharmacy = require_roles(UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.SUPER_ADMIN)
require_technician = require_roles(UserRole.TECHNICIAN, UserRole.LAB_TECH, UserRole.ADMIN, UserRole.SUPER_ADMIN)
require_insurance = require_roles(UserRole.INSURANCE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN)


def get_client_ip(request: Request) -> str:
    """Extract the real client IP, respecting X-Forwarded-For from proxies."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
