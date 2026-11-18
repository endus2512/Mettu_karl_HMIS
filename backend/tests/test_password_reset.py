"""
Integration & security tests for Self-Service Password Recovery (OTP + Reset Flow).
"""
import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.core.rate_limiter import clear_all_rate_limits
from app.core.security import hash_password
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_password_reset_full_flow_rotates_password_and_revokes_refresh(
    client: AsyncClient, db_session
):
    """Happy path: request OTP -> confirm with valid OTP -> old password fails -> new password works & old refresh token revoked."""
    clear_all_rate_limits()
    user = User(
        username="nurse_recovery_test",
        email="nurse.rec@mettukarl.gov.et",
        full_name="Nurse Tigist Bekele",
        staff_id="MKH-NUR-901",
        phone_number="+251911223344",
        hashed_password=hash_password("OldSecurePass2026!"),
        role=UserRole.NURSE,
        is_active=True,
        approval_status="approved",
    )
    db_session.add(user)
    await db_session.commit()

    # 1. Login with old password to get an active refresh token
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"username": "nurse_recovery_test", "password": "OldSecurePass2026!"},
    )
    assert login_res.status_code == 200
    old_refresh = login_res.json()["refresh_token"]

    # 2. Request password recovery OTP
    req_res = await client.post(
        "/api/v1/auth/password-reset/request",
        json={"identifier": "MKH-NUR-901", "language": "om"},
    )
    assert req_res.status_code == 200
    req_data = req_res.json()
    assert req_data["status"] == "otp_dispatched"
    assert req_data["challenge_token"]
    assert req_data["masked_destination"] == "+251****344"
    assert req_data["dev_otp_code"] and len(req_data["dev_otp_code"]) == 6

    # 3. Confirm OTP and rotate password
    confirm_res = await client.post(
        "/api/v1/auth/password-reset/confirm",
        json={
            "challenge_token": req_data["challenge_token"],
            "otp_code": req_data["dev_otp_code"],
            "new_password": "BrandNewPassword2026!",
        },
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "password_updated"
    assert confirm_res.json()["username"] == "nurse_recovery_test"

    # 4. Replay of the same challenge_token + OTP must be rejected (single-use cryptographic binding)
    replay_res = await client.post(
        "/api/v1/auth/password-reset/confirm",
        json={
            "challenge_token": req_data["challenge_token"],
            "otp_code": req_data["dev_otp_code"],
            "new_password": "AnotherPassword2026!",
        },
    )
    assert replay_res.status_code == 400

    # 5. Old refresh token must be revoked immediately
    ref_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_refresh},
    )
    assert ref_res.status_code == 401

    # 6. Old password fails, new password succeeds
    old_login = await client.post(
        "/api/v1/auth/login",
        json={"username": "nurse_recovery_test", "password": "OldSecurePass2026!"},
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/api/v1/auth/login",
        json={"username": "nurse_recovery_test", "password": "BrandNewPassword2026!"},
    )
    assert new_login.status_code == 200
    assert new_login.json()["access_token"]


@pytest.mark.asyncio
async def test_password_reset_wrong_otp_rejected_and_rate_limited(
    client: AsyncClient, db_session
):
    """Repeated invalid OTP guesses must return 401 and then 429 rate-limit."""
    clear_all_rate_limits()
    user = User(
        username="lab_otp_guard",
        email="lab.otp@mettukarl.gov.et",
        full_name="Lab Tech Chala",
        staff_id="MKH-LAB-902",
        phone_number="+251922110099",
        hashed_password=hash_password("InitialLabPass2026!"),
        role=UserRole.LAB_TECH,
        is_active=True,
        approval_status="approved",
    )
    db_session.add(user)
    await db_session.commit()

    req_res = await client.post(
        "/api/v1/auth/password-reset/request",
        json={"identifier": "lab_otp_guard", "language": "en"},
    )
    assert req_res.status_code == 200
    req_data = req_res.json()
    wrong_otp = "000000" if req_data["dev_otp_code"] != "000000" else "999999"

    for _ in range(5):
        res = await client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "challenge_token": req_data["challenge_token"],
                "otp_code": wrong_otp,
                "new_password": "AttemptedNewPass2026!",
            },
        )
        assert res.status_code == 401

    blocked = await client.post(
        "/api/v1/auth/password-reset/confirm",
        json={
            "challenge_token": req_data["challenge_token"],
            "otp_code": req_data["dev_otp_code"],
            "new_password": "AttemptedNewPass2026!",
        },
    )
    assert blocked.status_code == 429


@pytest.mark.asyncio
async def test_password_reset_non_enumerating_unknown_and_production_hides_dev_otp(
    client: AsyncClient, db_session, monkeypatch
):
    """Unknown accounts never return 404, and production never exposes dev_otp_code."""
    clear_all_rate_limits()

    # Unknown identifier -> 200 generic non-enumerating response
    unknown_res = await client.post(
        "/api/v1/auth/password-reset/request",
        json={"identifier": "nonexistent_user_xyz", "language": "en"},
    )
    assert unknown_res.status_code == 200
    unknown_body = unknown_res.json()
    assert unknown_body["status"] == "submitted"
    assert unknown_body["challenge_token"] is None
    assert unknown_body["dev_otp_code"] is None

    # Production environment must NEVER return dev_otp_code
    user = User(
        username="prod_hide_otp",
        email="prod.otp@mettukarl.gov.et",
        full_name="Dr. Gemechu",
        staff_id="MKH-DOC-903",
        phone_number="+251933445566",
        hashed_password=hash_password("ProdDoctorPass2026!"),
        role=UserRole.DOCTOR,
        is_active=True,
        approval_status="approved",
    )
    db_session.add(user)
    await db_session.commit()

    monkeypatch.setattr(settings, "APP_ENV", "production")
    prod_res = await client.post(
        "/api/v1/auth/password-reset/request",
        json={"identifier": "prod_hide_otp", "language": "am"},
    )
    assert prod_res.status_code == 200
    prod_body = prod_res.json()
    assert prod_body["status"] == "otp_dispatched"
    assert prod_body["challenge_token"]
    assert prod_body["dev_otp_code"] is None
