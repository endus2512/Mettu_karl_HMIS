"""
End-to-end tests for Staff Self-Registration Pending Admin Approval,
Anti-Impersonation Guards, and Admin Approval/Rejection Governance.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_staff_signup_locked_pending_until_admin_approval(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_auth_headers: dict[str, str],
    doctor_auth_headers: dict[str, str],
) -> None:
    """
    Self-registered clinicians stay locked in PENDING state (`is_active=False`,
    provisional least-privilege role, zero tokens) until explicitly verified by Admin.
    """
    reg_res = await client.post(
        "/api/v1/auth/staff/register",
        json={
            "full_name": "Dr. Bontu Tadesse",
            "staff_id": "MKRH-DOC-9001",
            "department": "doctor",
            "requested_role": "doctor",
            "license_number": "EFDA-MD-2026-9001",
            "password": "BontuSecurePass2026!",
        },
    )
    assert reg_res.status_code == 201, reg_res.text
    reg_data = reg_res.json()
    assert reg_data["approval_status"] == "pending"
    assert reg_data["staff_id"] == "MKRH-DOC-9001"
    assert "access_token" not in reg_data
    assert "refresh_token" not in reg_data

    # Inspect DB row: must be inactive with provisional non-clinical role
    user_row = (
        await db_session.execute(select(User).where(User.staff_id == "MKRH-DOC-9001"))
    ).scalar_one()
    assert user_row.is_active is False
    assert user_row.approval_status == "pending"
    assert user_row.role == UserRole.RECEPTIONIST
    assert user_row.requested_role == "doctor"

    # Dev password shortcut must NEVER work on self-enrolled staff
    dev_try = await client.post(
        "/api/v1/auth/login",
        json={"username": "MKRH-DOC-9001", "password": "DoctorPassword2026!"},
    )
    assert dev_try.status_code == 401

    # Even with exact password, login is blocked with 403 while pending
    pending_login = await client.post(
        "/api/v1/auth/login",
        json={"username": "MKRH-DOC-9001", "password": "BontuSecurePass2026!"},
    )
    assert pending_login.status_code == 403
    assert "pending" in pending_login.json()["detail"].lower()

    # Forged/stale token for pending user is blocked by get_current_user (403)
    stale_tok = create_access_token(subject=user_row.id, extra_claims={"role": "doctor"})
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {stale_tok}"})
    assert me_res.status_code == 403

    # Unauthenticated and non-admin staff cannot view or act on approval queue
    unauth_queue = await client.get("/api/v1/auth/staff/requests")
    assert unauth_queue.status_code == 401
    doc_queue = await client.get("/api/v1/auth/staff/requests", headers=doctor_auth_headers)
    assert doc_queue.status_code == 403
    doc_approve = await client.post(
        f"/api/v1/auth/staff/requests/{user_row.id}/approve",
        json={"assigned_role": "doctor"},
        headers=doctor_auth_headers,
    )
    assert doc_approve.status_code == 403

    # Admin sees pending request and approves it cleanly
    adm_queue = await client.get("/api/v1/auth/staff/requests", headers=admin_auth_headers)
    assert adm_queue.status_code == 200
    assert any(item["staff_id"] == "MKRH-DOC-9001" for item in adm_queue.json())

    approve_res = await client.post(
        f"/api/v1/auth/staff/requests/{user_row.id}/approve",
        json={"assigned_role": "doctor"},
        headers=admin_auth_headers,
    )
    assert approve_res.status_code == 200, approve_res.text
    approved = approve_res.json()
    assert approved["approval_status"] == "approved"
    assert approved["is_active"] is True
    assert approved["role"] == "doctor"

    # Now applicant logs in with Staff ID and real password -> 200
    ok_login = await client.post(
        "/api/v1/auth/login",
        json={"username": "MKRH-DOC-9001", "password": "BontuSecurePass2026!"},
    )
    assert ok_login.status_code == 200
    tok = ok_login.json()["access_token"]
    assert ok_login.json()["role"] == "doctor"

    # Approved doctor accesses clinical admissions, stays blocked from Admin endpoints
    adm_blocked = await client.get(
        "/api/v1/analytics/executive-summary",
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert adm_blocked.status_code == 403

    # Live revocation: if Admin later revokes/rejects the user, existing JWT fails immediately
    revoke_res = await client.post(
        f"/api/v1/auth/staff/requests/{user_row.id}/reject",
        json={"rejection_reason": "Contract ended"},
        headers=admin_auth_headers,
    )
    assert revoke_res.status_code == 200
    after_revoke = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert after_revoke.status_code == 403


@pytest.mark.asyncio
async def test_impersonation_and_privilege_escalation_guards(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_auth_headers: dict[str, str],
) -> None:
    """
    Verify self-signup cannot impersonate reserved accounts, claim super_admin,
    skip clinical licenses, or sneak past Admin impersonation flagging.
    """
    # 1. Super Admin self-request -> immediate 403
    super_try = await client.post(
        "/api/v1/auth/staff/register",
        json={
            "full_name": "Evil Attacker",
            "staff_id": "MKRH-ATK-001",
            "department": "admin",
            "requested_role": "super_admin",
            "password": "AttackerPassword2026!",
        },
    )
    assert super_try.status_code == 403

    # 2. Reserved identifier impersonation -> immediate 409
    reserved_try = await client.post(
        "/api/v1/auth/staff/register",
        json={
            "full_name": "Fake Dawit",
            "staff_id": "admin",
            "department": "admin",
            "requested_role": "admin",
            "password": "AttackerPassword2026!",
        },
    )
    assert reserved_try.status_code == 409

    # 3. Missing clinical license -> 422
    no_lic = await client.post(
        "/api/v1/auth/staff/register",
        json={
            "full_name": "Unlicensed Pretender",
            "staff_id": "MKRH-FAKE-DOC-1",
            "department": "doctor",
            "requested_role": "doctor",
            "password": "FakeDocPassword2026!",
        },
    )
    assert no_lic.status_code == 422

    # 4. Spoofing Admin role + Executive Title -> Quarantined with Risk Flags, NEVER active or admin
    fake_adm = await client.post(
        "/api/v1/auth/staff/register",
        json={
            "full_name": "Hospital System Administrator",
            "staff_id": "MKRH-IMP-999",
            "department": "admin",
            "requested_role": "admin",
            "password": "ImpostorPassword2026!",
        },
    )
    assert fake_adm.status_code == 201, fake_adm.text
    fake_data = fake_adm.json()
    assert fake_data["approval_status"] == "pending"
    assert "PRIVILEGED_ROLE_CLAIM" in (fake_data["risk_flag"] or "")
    assert "EXECUTIVE_NAME_IMPERSONATION_RISK" in (fake_data["risk_flag"] or "")

    # Login attempt immediately blocked (403)
    fake_login = await client.post(
        "/api/v1/auth/login",
        json={"username": "MKRH-IMP-999", "password": "ImpostorPassword2026!"},
    )
    assert fake_login.status_code == 403

    # Non-super-admin Admin cannot grant ADMIN privilege (must be SUPER_ADMIN)
    escalate_try = await client.post(
        f"/api/v1/auth/staff/requests/{fake_data['id']}/approve",
        json={"assigned_role": "admin"},
        headers=admin_auth_headers,
    )
    assert escalate_try.status_code == 403

    # Admin rejects the suspected impersonator
    reject_res = await client.post(
        f"/api/v1/auth/staff/requests/{fake_data['id']}/reject",
        json={"rejection_reason": "Unauthorized admin impersonation attempt"},
        headers=admin_auth_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["approval_status"] == "rejected"
    assert reject_res.json()["is_active"] is False

    # Rejected user stays locked (403)
    rejected_login = await client.post(
        "/api/v1/auth/login",
        json={"username": "MKRH-IMP-999", "password": "ImpostorPassword2026!"},
    )
    assert rejected_login.status_code == 403
    assert "rejected" in rejected_login.json()["detail"].lower()

    # Duplicate Staff ID blocked even after rejection (409)
    dup_try = await client.post(
        "/api/v1/auth/staff/register",
        json={
            "full_name": "Retry Guy",
            "staff_id": "MKRH-IMP-999",
            "department": "reception",
            "requested_role": "receptionist",
            "password": "RetryPassword2026!",
        },
    )
    assert dup_try.status_code == 409

    # Confirm Super Admin CAN approve a legitimate ICT Admin request if needed
    legit_ict = await client.post(
        "/api/v1/auth/staff/register",
        json={
            "full_name": "Hanna Kebede",
            "staff_id": "MKRH-ICT-2026",
            "department": "ict",
            "requested_role": "ict_admin",
            "password": "HannaIctPassword2026!",
        },
    )
    assert legit_ict.status_code == 201
    ict_id = legit_ict.json()["id"]

    super_user = User(
        username="root_super_test",
        email="root_super@mettukarl.gov.et",
        full_name="Root Super",
        hashed_password=hash_password("SuperPass2026!"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(super_user)
    await db_session.commit()
    await db_session.refresh(super_user)
    super_tok = create_access_token(subject=super_user.id, extra_claims={"role": "super_admin"})

    grant_admin = await client.post(
        f"/api/v1/auth/staff/requests/{ict_id}/approve",
        json={"assigned_role": "admin"},
        headers={"Authorization": f"Bearer {super_tok}"},
    )
    assert grant_admin.status_code == 200
    assert grant_admin.json()["role"] == "admin"
    assert grant_admin.json()["is_active"] is True
