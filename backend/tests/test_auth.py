"""
Unit and integration tests for authentication and lockout features.
"""
import pytest
from httpx import AsyncClient

from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_login_successful(client: AsyncClient, test_doctor_user: User):
    """Test successful credential authentication returns token."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "dr_karl", "password": "DoctorSecurePass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["requires_mfa"] is False
    assert data["username"] == "dr_karl"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, test_doctor_user: User):
    """Test login failure with bad password."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "dr_karl", "password": "WrongPassword!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_account_lockout_after_consecutive_failures(client: AsyncClient, test_doctor_user: User):
    """Verify that 5 failed attempts locks the account."""
    for _ in range(5):
        res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr_karl", "password": "WrongPassword!"},
        )
        assert res.status_code == 401

    # 6th attempt should return lockout message
    lockout_res = await client.post(
        "/api/v1/auth/login",
        json={"username": "dr_karl", "password": "WrongPassword!"},
    )
    assert lockout_res.status_code == 401
    assert "locked" in lockout_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient, doctor_auth_headers: dict[str, str]):
    """Test retrieving authenticated user profile."""
    response = await client.get("/api/v1/auth/me", headers=doctor_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "dr_karl"
    assert data["role"] == "doctor"


@pytest.mark.asyncio
async def test_admin_login_case_insensitive_and_aliases(client: AsyncClient, db_session):
    """Admin login should succeed regardless of keyboard capitalization or legacy alias."""
    from app.core.security import hash_password

    admin_user = User(
        username="admin",
        email="admin@mettukarl.gov.et",
        full_name="Hospital System Administrator",
        hashed_password=hash_password("AdminSecurePassword2026!"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(admin_user)
    await db_session.commit()

    for alias in ["admin", "Admin", "ADMIN", "superadmin", "Super Admin", "admin_dawit"]:
        res = await client.post(
            "/api/v1/auth/login",
            json={"username": alias, "password": "AdminSecurePassword2026!"},
        )
        assert res.status_code == 200, f"Failed for alias {alias}: {res.text}"
        body = res.json()
        assert body["username"] == "admin"
        assert body["role"] == "super_admin"


@pytest.mark.asyncio
async def test_naive_locked_until_does_not_crash(client: AsyncClient, db_session, test_doctor_user: User):
    """Naive locked_until loaded from SQLite must cleanly return 401 instead of raising TypeError."""
    from datetime import datetime, timedelta

    test_doctor_user.locked_until = datetime.now() + timedelta(minutes=10)
    await db_session.commit()

    res = await client.post(
        "/api/v1/auth/login",
        json={"username": "dr_karl", "password": "DoctorSecurePass123!"},
    )
    assert res.status_code == 401
    assert "locked" in res.json()["detail"].lower()
