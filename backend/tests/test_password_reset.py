"""
Integration & anti-impersonation security tests for 5-Minute Self-Service Password Recovery.
"""
import pyotp
import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.core.rate_limiter import clear_all_rate_limits
from app.core.security import hash_password
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_password_reset_5min_full_flow_and_replay_protection(
    client: AsyncClient, db_session
):
    """Happy path: 2-factor identity match -> 5-min OTP (300s) -> password rotated -> replay blocked & old refresh revoked."""
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

    # 2. Request 5-minute OTP with BOTH Staff ID AND registered phone (accepts local 09... normalized to +251...)
    req_res = await client.post(
        "/api/v1/auth/password-reset/request",
        json={
            "identifier": "MKH-NUR-901",
            "verification_contact": "0911223344",
            "language": "om",
        },
    )
    assert req_res.status_code == 200
    req_data = req_res.json()
    assert req_data["status"] == "otp_dispatched"
    assert req_data["expires_in_seconds"] == 300
    assert req_data["challenge_token"]
    assert req_data["masked_destination"] == "+251****344"
    assert req_data["dev_otp_code"] and len(req_data["dev_otp_code"]) == 6

    # 3. Cross-IP hijack attempt using the stolen challenge_token + OTP must be BLOCKED (403)
    hijack_res = await client.post(
        "/api/v1/auth/password-reset/confirm",
        headers={"X-Forwarded-For": "203.0.113.99"},
        json={
            "challenge_token": req_data["challenge_token"],
            "otp_code": req_data["dev_otp_code"],
            "new_password": "HijackerPassword2026!",
        },
    )
    assert hijack_res.status_code == 403

    # 4. Confirm OTP from the legitimate requesting IP and rotate password
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

    # 5. Replay of the same challenge_token + OTP must be rejected (single-use cryptographic binding)
    replay_res = await client.post(
        "/api/v1/auth/password-reset/confirm",
        json={
            "challenge_token": req_data["challenge_token"],
            "otp_code": req_data["dev_otp_code"],
            "new_password": "AnotherPassword2026!",
        },
    )
    assert replay_res.status_code == 400

    # 6. Old refresh token must be revoked immediately
    ref_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_refresh},
    )
    assert ref_res.status_code == 401

    # 7. Old password fails, new password succeeds
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
async def test_impersonation_mismatched_contact_blocks_otp_dispatch(
    client: AsyncClient, db_session
):
    """Impersonator who knows only username/staff_id but NOT the registered phone/email must NOT get an OTP."""
    clear_all_rate_limits()
    user = User(
        username="dr_victim",
        email="dr.victim@mettukarl.gov.et",
        full_name="Dr. Abebe Victim",
        staff_id="MKH-DOC-999",
        phone_number="+251911778899",
        hashed_password=hash_password("VictimPass2026!"),
        role=UserRole.DOCTOR,
        is_active=True,
        approval_status="approved",
    )
    db_session.add(user)
    await db_session.commit()

    res = await client.post(
        "/api/v1/auth/password-reset/request",
        json={
            "identifier": "dr_victim",
            "verification_contact": "+251999000111",  # attacker's own phone!
            "language": "om",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "submitted"
    assert body["challenge_token"] is None
    assert body["dev_otp_code"] is None
    assert body["delivery_status"] == "verification_failed"


@pytest.mark.asyncio
async def test_password_reset_wrong_otp_rate_limited_after_3_attempts(
    client: AsyncClient, db_session
):
    """Strict 3-attempt OTP brute-force limit returns 401 then 429."""
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
        json={
            "identifier": "lab_otp_guard",
            "verification_contact": "lab.otp@mettukarl.gov.et",
            "language": "en",
        },
    )
    assert req_res.status_code == 200
    req_data = req_res.json()
    wrong_otp = "000000" if req_data["dev_otp_code"] != "000000" else "999999"

    for _ in range(3):
        res = await client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "challenge_token": req_data["challenge_token"],
                "otp_code": wrong_otp,
                "new_password": "AttemptedNewPass2026!",
            },
        )
        assert res.status_code == 401

    # 4th attempt (even with correct OTP) is locked out with 429
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
async def test_mfa_account_requires_totp_and_super_admin_without_mfa_blocked(
    client: AsyncClient, db_session, monkeypatch
):
    """MFA accounts require live TOTP code in Step 2; Super Admin without MFA is blocked from remote reset; prod hides dev OTP."""
    clear_all_rate_limits()

    # 1. Super Admin without MFA -> blocked with 403
    super_admin = User(
        username="root_guard_admin",
        email="root.guard@mettukarl.gov.et",
        full_name="Root Admin",
        phone_number="+251911000001",
        hashed_password=hash_password("SuperAdminPass2026!"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_mfa_enabled=False,
        approval_status="approved",
    )
    # 2. Doctor with MFA enabled -> requires TOTP code in Step 2
    mfa_secret = pyotp.random_base32()
    mfa_doctor = User(
        username="dr_mfa_protected",
        email="dr.mfa@mettukarl.gov.et",
        full_name="Dr. MFA Protected",
        phone_number="+251933445566",
        hashed_password=hash_password("MfaDocPass2026!"),
        role=UserRole.DOCTOR,
        is_active=True,
        is_mfa_enabled=True,
        mfa_secret=mfa_secret,
        approval_status="approved",
    )
    db_session.add_all([super_admin, mfa_doctor])
    await db_session.commit()

    sa_res = await client.post(
        "/api/v1/auth/password-reset/request",
        json={
            "identifier": "root_guard_admin",
            "verification_contact": "+251911000001",
            "language": "om",
        },
    )
    assert sa_res.status_code == 403

    # Request OTP for MFA-protected doctor
    mfa_req = await client.post(
        "/api/v1/auth/password-reset/request",
        json={
            "identifier": "dr_mfa_protected",
            "verification_contact": "dr.mfa@mettukarl.gov.et",
            "language": "en",
        },
    )
    assert mfa_req.status_code == 200
    mfa_data = mfa_req.json()
    assert mfa_data["requires_mfa_totp"] is True

    # Confirm WITHOUT mfa_totp_code must fail (401)
    no_totp = await client.post(
        "/api/v1/auth/password-reset/confirm",
        json={
            "challenge_token": mfa_data["challenge_token"],
            "otp_code": mfa_data["dev_otp_code"],
            "new_password": "NewMfaDocPass2026!",
        },
    )
    assert no_totp.status_code == 401

    # Confirm WITH valid live TOTP code succeeds (200)
    live_totp = pyotp.TOTP(mfa_secret).now()
    with_totp = await client.post(
        "/api/v1/auth/password-reset/confirm",
        json={
            "challenge_token": mfa_data["challenge_token"],
            "otp_code": mfa_data["dev_otp_code"],
            "mfa_totp_code": live_totp,
            "new_password": "NewMfaDocPass2026!",
        },
    )
    assert with_totp.status_code == 200

    # 3. Production environment must NEVER expose dev_otp_code
    monkeypatch.setattr(settings, "APP_ENV", "production")
    clear_all_rate_limits()
    prod_res = await client.post(
        "/api/v1/auth/password-reset/request",
        json={
            "identifier": "dr_mfa_protected",
            "verification_contact": "+251933445566",
            "language": "am",
        },
    )
    assert prod_res.status_code == 200
    assert prod_res.json()["dev_otp_code"] is None
    assert prod_res.json()["expires_in_seconds"] == 300
