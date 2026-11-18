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


@pytest.mark.asyncio
async def test_staff_login_brute_force_rate_limit(client: AsyncClient):
    """Repeated failed staff logins for an identifier must trigger HTTP 429 with Retry-After."""
    from app.core.config import settings
    from app.core.rate_limiter import clear_all_rate_limits

    clear_all_rate_limits()
    probe_user = "nonexistent_bruteforce_probe_99"
    for _ in range(settings.STAFF_LOGIN_RATE_LIMIT_MAX_ATTEMPTS):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"username": probe_user, "password": "WrongPassword999!"},
        )
        assert resp.status_code == 401

    blocked = await client.post(
        "/api/v1/auth/login",
        json={"username": probe_user, "password": "WrongPassword999!"},
    )
    assert blocked.status_code == 429
    assert "retry-after" in {k.lower() for k in blocked.headers.keys()}
    clear_all_rate_limits()


@pytest.mark.asyncio
async def test_security_posture_endpoint_admin_only(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    doctor_auth_headers: dict[str, str],
):
    """Security posture audit endpoint must be Admin-only and return live hardening status."""
    denied = await client.get("/api/v1/auth/security-posture", headers=doctor_auth_headers)
    assert denied.status_code == 403

    res = await client.get("/api/v1/auth/security-posture", headers=admin_auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["staff_login_rate_limit_enabled"] is True
    assert body["patient_login_rate_limit_enabled"] is True
    assert "secret_key_hardened" in body
    assert "database_engine" in body
    assert isinstance(body["recommendations"], list)
