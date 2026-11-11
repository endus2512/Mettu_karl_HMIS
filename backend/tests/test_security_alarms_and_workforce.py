"""
End-to-end tests for Admin Security Alarms, First-Time Staff Access Detection,
Live Workforce Presence Monitoring, and Immediate Block/Allow Governance.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.notification import ClinicalNotification
from app.models.user import User, UserRole


async def _super_admin_headers(db_session: AsyncSession) -> tuple[User, dict[str, str]]:
    """Create a Root Super Admin user matching production bootstrap admin."""
    super_admin = User(
        username="super_admin_karl",
        email="super.admin@mettukarl.gov.et",
        full_name="Root Super Administrator",
        hashed_password=hash_password("SuperSecurePass2026!"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(super_admin)
    await db_session.commit()
    await db_session.refresh(super_admin)
    token = create_access_token(
        subject=super_admin.id,
        extra_claims={"role": super_admin.role.value, "username": super_admin.username},
    )
    return super_admin, {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_alarms_and_workforce_strict_admin_rbac(
    client: AsyncClient,
    test_doctor_user: User,
    doctor_auth_headers: dict[str, str],
    nurse_auth_headers: dict[str, str],
    pharmacist_auth_headers: dict[str, str],
) -> None:
    """Unauthenticated (401) and non-admin clinicians (403) cannot access Admin alarms or workforce."""
    for path in ["/api/v1/auth/staff/alarms", "/api/v1/auth/staff/workforce"]:
        unauth = await client.get(path)
        assert unauth.status_code == 401
        for headers in (doctor_auth_headers, nurse_auth_headers, pharmacist_auth_headers):
            forbidden = await client.get(path, headers=headers)
            assert forbidden.status_code == 403

    unauth_hb = await client.post("/api/v1/auth/heartbeat", json={"current_path": "/portal/doctor"})
    assert unauth_hb.status_code == 401

    doc_control = await client.post(
        f"/api/v1/auth/staff/{test_doctor_user.id}/status",
        json={"action": "block", "reason": "Unauthorized caller"},
        headers=nurse_auth_headers,
    )
    assert doc_control.status_code == 403


@pytest.mark.asyncio
async def test_signup_impersonation_and_login_attempts_emit_persistent_admin_alarms(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_auth_headers: dict[str, str],
) -> None:
    """
    Sign-up requests, privilege escalation/impersonation blocks, pending login attempts,
    and unknown credential probes immediately persist committed Admin alarms with full identity.
    """
    _, super_headers = await _super_admin_headers(db_session)

    # 1. Valid self-registration for Pharmacist from distinct IP
    reg_pharm = await client.post(
        "/api/v1/auth/staff/register",
        headers={"X-Forwarded-For": "10.10.20.11"},
        json={
            "full_name": "Abebe Pharmacists",
            "staff_id": "MKRH-PHM-3101",
            "department": "pharmacy",
            "requested_role": "pharmacist",
            "license_number": "EFDA-PHM-3101",
            "phone_number": "+251911223344",
            "password": "PharmJoinPass2026!",
        },
    )
    assert reg_pharm.status_code == 201, reg_pharm.text

    # 2. High-risk Admin request
    reg_adm_claim = await client.post(
        "/api/v1/auth/staff/register",
        headers={"X-Forwarded-For": "10.10.20.12"},
        json={
            "full_name": "Suspicious Admin Applicant",
            "staff_id": "MKRH-ADM-3102",
            "department": "ict_admin",
            "requested_role": "admin",
            "password": "AdminJoinPass2026!",
        },
    )
    assert reg_adm_claim.status_code == 201, reg_adm_claim.text

    # 3. Blocked Super Admin escalation (403 must still commit alarm!)
    esc_res = await client.post(
        "/api/v1/auth/staff/register",
        headers={"X-Forwarded-For": "10.10.20.13"},
        json={
            "full_name": "Attacker Root",
            "staff_id": "MKRH-ATK-3103",
            "department": "ict_admin",
            "requested_role": "super_admin",
            "password": "AttackPass2026!",
        },
    )
    assert esc_res.status_code == 403

    # 4. Blocked reserved identifier impersonation (409 must still commit alarm!)
    imp_res = await client.post(
        "/api/v1/auth/staff/register",
        headers={"X-Forwarded-For": "10.10.20.14"},
        json={
            "full_name": "Fake Doctor Impersonator",
            "staff_id": "dr_bekele",
            "department": "doctor",
            "requested_role": "doctor",
            "license_number": "EFDA-FAKE-99",
            "password": "ImpersonatePass2026!",
        },
    )
    assert imp_res.status_code == 409

    # 5. Pending staff login attempt (403 must still commit alarm!)
    pending_try = await client.post(
        "/api/v1/auth/login",
        headers={"X-Forwarded-For": "10.10.20.15"},
        json={"username": "MKRH-PHM-3101", "password": "PharmJoinPass2026!"},
    )
    assert pending_try.status_code == 403

    # 6. Unknown user credential probe (401 must still commit alarm!)
    unknown_try = await client.post(
        "/api/v1/auth/login",
        headers={"X-Forwarded-For": "10.10.20.16"},
        json={"username": "ghost_intruder_99", "password": "WrongPassword99!"},
    )
    assert unknown_try.status_code == 401

    # Verify Admin AND Super Admin both see all 6 alarms cleanly via /staff/alarms and /events/notifications
    alarms_res = await client.get("/api/v1/auth/staff/alarms?limit=50", headers=super_headers)
    assert alarms_res.status_code == 200
    alarms = alarms_res.json()
    event_types = {a["event_type"] for a in alarms}
    assert {
        "STAFF_SIGNUP_NEW",
        "STAFF_SIGNUP_HIGH_RISK",
        "STAFF_SIGNUP_ESCALATION_BLOCKED",
        "STAFF_SIGNUP_IMPERSONATION_BLOCKED",
        "PENDING_STAFF_LOGIN_ATTEMPT",
        "UNKNOWN_USER_LOGIN_ATTEMPT",
    }.issubset(event_types)

    pharm_alarm = next(a for a in alarms if a["staff_id"] == "MKRH-PHM-3101" and a["event_type"] == "STAFF_SIGNUP_NEW")
    assert pharm_alarm["actor_name"] == "Abebe Pharmacists"
    assert pharm_alarm["license_number"] == "EFDA-PHM-3101"
    assert pharm_alarm["phone_number"] == "+251911223344"
    assert pharm_alarm["ip_address"] == "10.10.20.11"
    assert pharm_alarm["user_approval_status"] == "pending"

    # Super Admin bell feed must receive target_role='admin' notifications too
    bell_res = await client.get("/api/v1/events/notifications?limit=50", headers=super_headers)
    assert bell_res.status_code == 200
    assert any("Abebe Pharmacists" in item["message"] for item in bell_res.json()["items"])

    # Admin acknowledge marks notification read
    ack_res = await client.post(
        f"/api/v1/auth/staff/alarms/{pharm_alarm['id']}/ack",
        headers=admin_auth_headers,
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["is_read"] is True


@pytest.mark.asyncio
async def test_first_time_login_alarm_triggers_once_across_all_staff_roles(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_auth_headers: dict[str, str],
) -> None:
    """
    First-time login for doctor, nurse, and pharmacist each emits exactly one STAFF_FIRST_LOGIN alarm
    and never leaks Admin security alarms to the non-admin staff member's notification bell.
    """
    candidates = [
        ("Dr. Chala First", "MKRH-DOC-4101", "doctor", "10.20.1.1"),
        ("Nurse Tigist First", "MKRH-NRS-4102", "nurse", "10.20.1.2"),
        ("Pharm Dawit First", "MKRH-PHM-4103", "pharmacy", "10.20.1.3"),
    ]
    req_role_map = {"doctor": "doctor", "nurse": "nurse", "pharmacy": "pharmacist"}

    users_created: list[User] = []
    for full_name, staff_id, dept, ip in candidates:
        res = await client.post(
            "/api/v1/auth/staff/register",
            headers={"X-Forwarded-For": ip},
            json={
                "full_name": full_name,
                "staff_id": staff_id,
                "department": dept,
                "requested_role": req_role_map[dept],
                "license_number": f"EFDA-{staff_id}",
                "password": "FirstLoginPass2026!",
            },
        )
        assert res.status_code == 201, res.text
        user_row = (
            await db_session.execute(select(User).where(User.staff_id == staff_id))
        ).scalar_one()
        users_created.append(user_row)

        # Admin approves each applicant via /staff/{id}/status activate
        act_res = await client.post(
            f"/api/v1/auth/staff/{user_row.id}/status",
            json={"action": "activate"},
            headers=admin_auth_headers,
        )
        assert act_res.status_code == 200, act_res.text

    tokens_by_id: dict[int, str] = {}
    for user_row, (full_name, staff_id, _, ip) in zip(users_created, candidates):
        # First login -> emits STAFF_FIRST_LOGIN
        login1 = await client.post(
            "/api/v1/auth/login",
            headers={"X-Forwarded-For": ip},
            json={"username": staff_id, "password": "FirstLoginPass2026!"},
        )
        assert login1.status_code == 200, login1.text
        tok = login1.json()["access_token"]
        tokens_by_id[user_row.id] = tok

        # Verify DB timestamp populated
        await db_session.refresh(user_row)
        assert user_row.first_login_at is not None

        # Second login -> must NOT emit duplicate STAFF_FIRST_LOGIN
        login2 = await client.post(
            "/api/v1/auth/login",
            headers={"X-Forwarded-For": ip},
            json={"username": staff_id, "password": "FirstLoginPass2026!"},
        )
        assert login2.status_code == 200, login2.text

        # Non-admin notification bell must NEVER contain Admin's security alarms
        staff_bell = await client.get(
            "/api/v1/events/notifications?limit=50",
            headers={"Authorization": f"Bearer {tok}"},
        )
        assert staff_bell.status_code == 200
        assert not any(
            item["category"].startswith("staff_") for item in staff_bell.json()["items"]
        ), f"Admin alarm leaked to {staff_id}"

    # Verify Admin sees exactly ONE STAFF_FIRST_LOGIN alarm per staff member (3 total)
    alarms_res = await client.get("/api/v1/auth/staff/alarms?limit=50", headers=admin_auth_headers)
    assert alarms_res.status_code == 200
    first_login_alarms = [a for a in alarms_res.json() if a["event_type"] == "STAFF_FIRST_LOGIN"]
    assert len(first_login_alarms) == 3
    assert {a["staff_id"] for a in first_login_alarms} == {
        "MKRH-DOC-4101",
        "MKRH-NRS-4102",
        "MKRH-PHM-4103",
    }

    # Verify persisted rows use target_user_id=None
    rows = (
        await db_session.execute(
            select(ClinicalNotification).where(ClinicalNotification.category == "staff_first_login")
        )
    ).scalars().all()
    assert len(rows) == 3
    assert all(r.target_user_id is None and r.target_role == "admin" for r in rows)


@pytest.mark.asyncio
async def test_workforce_presence_heartbeat_logout_and_admin_block_activate(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_auth_headers: dict[str, str],
    test_nurse_user: User,
) -> None:
    """
    Admin can monitor live working vs offline vs blocked status via heartbeat/logout
    and immediately block, inspect login alarm, unblock/activate, and update roles.
    """
    _, super_headers = await _super_admin_headers(db_session)

    # Nurse logs in and sends station heartbeat
    nurse_login = await client.post(
        "/api/v1/auth/login",
        headers={"X-Forwarded-For": "10.30.5.5"},
        json={"username": test_nurse_user.username, "password": "NurseSecurePass123!"},
    )
    assert nurse_login.status_code == 200
    nurse_token = nurse_login.json()["access_token"]
    nurse_headers = {"Authorization": f"Bearer {nurse_token}"}

    hb_res = await client.post(
        "/api/v1/auth/heartbeat",
        json={"current_path": "/portal/nurse"},
        headers={**nurse_headers, "X-Forwarded-For": "10.30.5.5"},
    )
    assert hb_res.status_code == 200
    assert hb_res.json()["work_status"] == "working_now"

    wf1 = await client.get("/api/v1/auth/staff/workforce", headers=admin_auth_headers)
    assert wf1.status_code == 200
    wf1_data = wf1.json()
    nurse_item1 = next(item for item in wf1_data["items"] if item["id"] == test_nurse_user.id)
    assert nurse_item1["work_status"] == "working_now"
    assert nurse_item1["last_activity_path"] == "/portal/nurse"
    assert nurse_item1["last_ip"] == "10.30.5.5"
    assert wf1_data["working_now_count"] >= 1

    # Logout marks nurse immediately offline
    logout_res = await client.post("/api/v1/auth/logout", headers=nurse_headers)
    assert logout_res.status_code == 200

    wf2 = await client.get("/api/v1/auth/staff/workforce", headers=admin_auth_headers)
    assert wf2.status_code == 200
    nurse_item2 = next(item for item in wf2.json()["items"] if item["id"] == test_nurse_user.id)
    assert nurse_item2["work_status"] == "offline"
    assert nurse_item2["last_activity_path"] == "LOGGED_OUT"

    # Log back in, then Admin blocks the nurse mid-shift
    nurse_login2 = await client.post(
        "/api/v1/auth/login",
        headers={"X-Forwarded-For": "10.30.5.6"},
        json={"username": test_nurse_user.username, "password": "NurseSecurePass123!"},
    )
    assert nurse_login2.status_code == 200
    active_tok = nurse_login2.json()["access_token"]
    active_headers = {"Authorization": f"Bearer {active_tok}"}

    block_res = await client.post(
        f"/api/v1/auth/staff/{test_nurse_user.id}/status",
        json={"action": "block", "reason": "Shift suspended by supervisor"},
        headers=admin_auth_headers,
    )
    assert block_res.status_code == 200
    assert block_res.json()["work_status"] == "blocked"
    assert block_res.json()["is_active"] is False

    # Existing JWT must immediately fail with 403
    me_blocked = await client.get("/api/v1/auth/me", headers=active_headers)
    assert me_blocked.status_code == 403
    assert "inactive" in me_blocked.json()["detail"].lower()

    # Blocked nurse attempting login triggers BLOCKED_STAFF_LOGIN_ATTEMPT alarm
    blocked_login_try = await client.post(
        "/api/v1/auth/login",
        headers={"X-Forwarded-For": "10.30.5.7"},
        json={"username": test_nurse_user.username, "password": "NurseSecurePass123!"},
    )
    assert blocked_login_try.status_code == 403

    alarms_after_block = await client.get("/api/v1/auth/staff/alarms?limit=50", headers=admin_auth_headers)
    assert any(
        a["event_type"] == "BLOCKED_STAFF_LOGIN_ATTEMPT" and a["actor_user_id"] == test_nurse_user.id
        for a in alarms_after_block.json()
    )

    # Regular ADMIN cannot escalate someone to ADMIN, but SUPER_ADMIN can
    esc_block = await client.post(
        f"/api/v1/auth/staff/{test_nurse_user.id}/status",
        json={"action": "activate", "assigned_role": "admin"},
        headers=admin_auth_headers,
    )
    assert esc_block.status_code == 403

    # Admin activates nurse with doctor role -> access immediately restored
    activate_res = await client.post(
        f"/api/v1/auth/staff/{test_nurse_user.id}/status",
        json={"action": "activate", "assigned_role": "doctor"},
        headers=super_headers,
    )
    assert activate_res.status_code == 200
    assert activate_res.json()["is_active"] is True
    assert activate_res.json()["role"] == "doctor"

    restored_login = await client.post(
        "/api/v1/auth/login",
        json={"username": test_nurse_user.username, "password": "NurseSecurePass123!"},
    )
    assert restored_login.status_code == 200
    me_ok = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {restored_login.json()['access_token']}"},
    )
    assert me_ok.status_code == 200
    assert me_ok.json()["role"] == "doctor"
