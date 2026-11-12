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


@pytest.mark.asyncio
async def test_role_chunked_requests_and_alarms_isolation(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
) -> None:
    """Requests and live alarms classify and filter applicants cleanly into profession role chunks."""
    applicants = [
        ("REG-NUR-201", "Nurse Bekelech Demissie", "nurse", "Emergency", "RN-99101"),
        ("REG-DOC-202", "Dr. Tolosa Bikila", "doctor", "Internal Medicine", "MD-88202"),
        ("REG-PHA-203", "Phm. Chaltu Negassa", "pharmacist", "Clinical Pharmacy", "EFDA-77303"),
        ("REG-ADM-204", "Fake Admin Applicant", "admin", "ICT Infrastructure", None),
    ]
    for staff_id, full_name, req_role, dept, license_no in applicants:
        res = await client.post(
            "/api/v1/auth/staff/register",
            headers={"X-Forwarded-For": "10.40.1.1"},
            json={
                "staff_id": staff_id,
                "full_name": full_name,
                "password": "StrongStaffPass2026!",
                "requested_role": req_role,
                "department": dept,
                "license_number": license_no,
                "phone_number": "+251911223344",
            },
        )
        assert res.status_code == 201
        data = res.json()
        assert data["verification_wait_token"]

    all_requests = await client.get(
        "/api/v1/auth/staff/requests?status_filter=pending",
        headers=admin_auth_headers,
    )
    assert all_requests.status_code == 200
    req_rows = all_requests.json()
    by_sid = {item["staff_id"]: item for item in req_rows}
    assert by_sid["REG-DOC-202"]["role_group"] == "doctor"
    assert by_sid["REG-NUR-201"]["role_group"] == "nurse"
    assert by_sid["REG-PHA-203"]["role_group"] == "pharmacist"
    assert by_sid["REG-ADM-204"]["role_group"] == "admin_security"

    # ?role_group= filter returns only matching profession chunk
    doc_only = await client.get(
        "/api/v1/auth/staff/requests?status_filter=pending&role_group=doctor",
        headers=admin_auth_headers,
    )
    assert doc_only.status_code == 200
    doc_rows = doc_only.json()
    assert len(doc_rows) >= 1
    assert all(row["role_group"] == "doctor" for row in doc_rows)
    assert any(row["staff_id"] == "REG-DOC-202" for row in doc_rows)

    # Alarms endpoint also tags each alarm with its canonical role_group
    alarms_res = await client.get(
        "/api/v1/auth/staff/alarms?limit=50",
        headers=admin_auth_headers,
    )
    assert alarms_res.status_code == 200
    alarm_groups = {
        a["staff_id"]: a["role_group"]
        for a in alarms_res.json()
        if a.get("staff_id") in by_sid
    }
    assert alarm_groups.get("REG-DOC-202") == "doctor"
    assert alarm_groups.get("REG-NUR-201") == "nurse"
    assert alarm_groups.get("REG-PHA-203") == "pharmacist"
    assert alarm_groups.get("REG-ADM-204") == "admin_security"


@pytest.mark.asyncio
async def test_spontaneous_verification_wait_token_flow_and_replay_protection(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
) -> None:
    """
    Zero-Trust spontaneous approval:
    - Self-signup returns verification_wait_token while remaining is_active=False.
    - Wrong password on pending account returns 401 with zero pending-wait headers.
    - Correct password on pending account returns 403 WITH X-Pending-Verification-Token.
    - Polling /staff/approval-status returns pending (zero JWT) until Admin approves.
    - Once approved, first poll returns approved + valid JWT + portal_path and triggers STAFF_FIRST_LOGIN alarm;
      replaying the consumed wait_token fails with 401.
    - Rejected applicant poll returns rejected with zero tokens and consumes wait_token.
    """
    reg_nurse = await client.post(
        "/api/v1/auth/staff/register",
        headers={"X-Forwarded-For": "10.40.2.10"},
        json={
            "staff_id": "WAIT-NUR-301",
            "full_name": "Nurse Bontu Kebede",
            "password": "NurseWaitPass2026!",
            "requested_role": "nurse",
            "department": "Maternity",
            "license_number": "RN-30199",
        },
    )
    assert reg_nurse.status_code == 201
    nurse_data = reg_nurse.json()
    nurse_id = nurse_data["id"]
    signup_wait_token = nurse_data["verification_wait_token"]
    assert isinstance(signup_wait_token, str) and len(signup_wait_token) > 20

    # Too-short wait token fails Pydantic validation (422); forged JWT signature fails decode (401)
    short_poll = await client.post(
        "/api/v1/auth/staff/approval-status",
        json={"wait_token": "short"},
    )
    assert short_poll.status_code == 422

    bad_poll = await client.post(
        "/api/v1/auth/staff/approval-status",
        json={"wait_token": "not-a-valid-jwt-token-at-all"},
    )
    assert bad_poll.status_code == 401

    # Poll while still pending -> 200 pending, zero JWT tokens issued
    pending_poll = await client.post(
        "/api/v1/auth/staff/approval-status",
        json={"wait_token": signup_wait_token},
    )
    assert pending_poll.status_code == 200
    pending_json = pending_poll.json()
    assert pending_json["status"] == "pending"
    assert pending_json["access_token"] is None
    assert pending_json["refresh_token"] is None

    # Wrong password on pending account MUST NOT emit X-Pending-Verification-Token
    wrong_pw = await client.post(
        "/api/v1/auth/login",
        headers={"X-Forwarded-For": "10.40.2.11"},
        json={"username": "wait-nur-301", "password": "WrongPassword999!"},
    )
    assert wrong_pw.status_code == 401
    assert "x-pending-verification-token" not in {k.lower() for k in wrong_pw.headers.keys()}

    # Correct password while pending returns 403 WITH refreshed X-Pending-Verification-Token
    valid_pw_pending = await client.post(
        "/api/v1/auth/login",
        headers={"X-Forwarded-For": "10.40.2.11"},
        json={"username": "wait-nur-301", "password": "NurseWaitPass2026!"},
    )
    assert valid_pw_pending.status_code == 403
    login_wait_token = valid_pw_pending.headers.get("X-Pending-Verification-Token")
    assert login_wait_token
    assert valid_pw_pending.headers.get("X-Pending-Staff-Id") == "WAIT-NUR-301"
    assert valid_pw_pending.headers.get("X-Pending-Requested-Role") == "nurse"

    # Admin approves the Nurse applicant
    approve_res = await client.post(
        f"/api/v1/auth/staff/requests/{nurse_id}/approve",
        json={"assigned_role": "nurse"},
        headers=admin_auth_headers,
    )
    assert approve_res.status_code == 200

    # Waiting /login session polls with login_wait_token -> spontaneously receives tokens + /portal/nurse
    approved_poll = await client.post(
        "/api/v1/auth/staff/approval-status",
        headers={"X-Forwarded-For": "10.40.2.11"},
        json={"wait_token": login_wait_token},
    )
    assert approved_poll.status_code == 200
    approved_json = approved_poll.json()
    assert approved_json["status"] == "approved"
    assert approved_json["assigned_role"] == "nurse"
    assert approved_json["portal_path"] == "/portal/nurse"
    assert approved_json["access_token"]
    assert approved_json["refresh_token"]

    # Issued access_token works immediately on protected /auth/me
    me_auto = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {approved_json['access_token']}"},
    )
    assert me_auto.status_code == 200
    assert me_auto.json()["role"] == "nurse"

    # First-time entry alarm recorded for spontaneous login
    alarms = await client.get("/api/v1/auth/staff/alarms?limit=50", headers=admin_auth_headers)
    assert any(
        a["event_type"] == "STAFF_FIRST_LOGIN" and a["actor_user_id"] == nurse_id
        for a in alarms.json()
    )

    # Replaying either the consumed login_wait_token or older signup_wait_token MUST fail with 401
    replay1 = await client.post(
        "/api/v1/auth/staff/approval-status",
        json={"wait_token": login_wait_token},
    )
    replay2 = await client.post(
        "/api/v1/auth/staff/approval-status",
        json={"wait_token": signup_wait_token},
    )
    assert replay1.status_code == 401
    assert replay2.status_code == 401

    # Rejection flow: applicant polls -> gets rejected + zero tokens -> wait_token invalidated
    reg_reject = await client.post(
        "/api/v1/auth/staff/register",
        headers={"X-Forwarded-For": "10.40.2.20"},
        json={
            "staff_id": "WAIT-REJ-302",
            "full_name": "Denied Applicant",
            "password": "DeniedPass2026!",
            "requested_role": "doctor",
            "department": "Surgery",
            "license_number": "INVALID-000",
        },
    )
    assert reg_reject.status_code == 201
    rej_id = reg_reject.json()["id"]
    rej_wait_token = reg_reject.json()["verification_wait_token"]

    rej_action = await client.post(
        f"/api/v1/auth/staff/requests/{rej_id}/reject",
        json={"rejection_reason": "Unverified license number"},
        headers=admin_auth_headers,
    )
    assert rej_action.status_code == 200

    rej_poll = await client.post(
        "/api/v1/auth/staff/approval-status",
        json={"wait_token": rej_wait_token},
    )
    assert rej_poll.status_code == 200
    rej_json = rej_poll.json()
    assert rej_json["status"] == "rejected"
    assert rej_json["access_token"] is None
    assert "Unverified license" in (rej_json.get("rejection_reason") or "")

    rej_replay = await client.post(
        "/api/v1/auth/staff/approval-status",
        json={"wait_token": rej_wait_token},
    )
    assert rej_replay.status_code == 401


@pytest.mark.asyncio
async def test_postgres_url_normalization_and_ephemeral_vercel_404_diagnostic(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify Neon/Vercel Postgres URLs normalize cleanly for asyncpg and 404 flags ephemeral SQLite."""
    from app.core.config import Settings, _default_database_url

    normalized = Settings.normalize_database_url(
        "postgres://u:p@ep-cool-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    )
    assert normalized.startswith("postgresql+asyncpg://u:p@ep-cool-pooler.us-east-1.aws.neon.tech/neondb")
    assert "sslmode=" not in normalized
    assert "channel_binding=" not in normalized
    assert "ssl=require" in normalized

    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setenv("POSTGRES_URL", "postgresql://user:pw@db.example.com:5432/his?sslmode=verify-full")
    resolved = Settings.normalize_database_url(_default_database_url())
    assert resolved == "postgresql+asyncpg://user:pw@db.example.com:5432/his?ssl=require"

    # When running with VERCEL=1 + sqlite, missing staff ID clearly reports ephemeral /tmp SQLite cause
    missing_res = await client.post(
        "/api/v1/auth/staff/999999/status",
        json={"action": "activate", "assigned_role": "doctor"},
        headers=admin_auth_headers,
    )
    assert missing_res.status_code == 404
    assert "ephemeral" in missing_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_directory_biography_edit_recovery_and_strict_blocking(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    doctor_auth_headers: dict[str, str],
) -> None:
    """
    Verify:
    1) Staff & Patient registration + full biography/profile view & edit by Admin.
    2) Admin credential recovery (lookup saved username + reset password + clear lockout).
    3) Approved returning staff can log in anytime using username or staff_id + password.
    4) Unapproved, blocked, or completely unknown staff/patients are strictly rejected.
    """
    # 0. RBAC: Doctor cannot access admin directory or recovery endpoints
    rbac_res = await client.get("/api/v1/auth/admin/directory", headers=doctor_auth_headers)
    assert rbac_res.status_code == 403

    # 1. Self-register a new Nurse with full profile + biography
    reg_staff = await client.post(
        "/api/v1/auth/staff/register",
        headers={"X-Forwarded-For": "10.50.1.15"},
        json={
            "staff_id": "REC-NURSE-501",
            "full_name": "Bontu Gemechu Tola",
            "email": "bontu.tola@mettukarl.gov.et",
            "phone_number": "+251933445566",
            "requested_role": "nurse",
            "department": "ICU",
            "license_number": "EFDA-NR-90501",
            "biography": "BSc Nursing (Jimma Univ), 6 years ICU & trauma triage experience at Mettu Karl.",
            "password": "NurseInitialPass2026!",
        },
    )
    assert reg_staff.status_code == 201
    staff_payload = reg_staff.json()
    staff_uid = staff_payload["id"]
    staff_username = staff_payload["username"]

    # Pending user MUST be blocked before Admin approval
    pending_login = await client.post(
        "/api/v1/auth/login",
        json={"username": staff_username, "password": "NurseInitialPass2026!"},
    )
    assert pending_login.status_code == 403

    # Admin approves once
    approve_res = await client.post(
        f"/api/v1/auth/staff/requests/{staff_uid}/approve",
        json={"assigned_role": "nurse"},
        headers=admin_auth_headers,
    )
    assert approve_res.status_code == 200

    # Approved returning staff can log in anytime with username OR staff_id
    return_by_username = await client.post(
        "/api/v1/auth/login",
        json={"username": staff_username, "password": "NurseInitialPass2026!"},
    )
    assert return_by_username.status_code == 200
    assert return_by_username.json()["role"] == "nurse"

    return_by_staff_id = await client.post(
        "/api/v1/auth/login",
        json={"username": "REC-NURSE-501", "password": "NurseInitialPass2026!"},
    )
    assert return_by_staff_id.status_code == 200
    assert return_by_staff_id.json()["role"] == "nurse"

    # Register a new Patient
    reg_patient = await client.post(
        "/api/v1/auth/patient/register",
        json={
            "full_name": "Tolasa Bekele Daba",
            "phone_number": "+251944556677",
            "fayda_id": "FAN-8844-1122-3399",
            "birth_place": "Mettu",
            "birth_date": "1994-05-12",
            "gender": "male",
            "password": "PatientSecret2026!",
        },
    )
    assert reg_patient.status_code == 200
    pat_me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {reg_patient.json()['access_token']}"},
    )
    assert pat_me.status_code == 200
    pat_uid = pat_me.json()["id"]

    # 2. Admin searches directory & inspects saved credentials + biography for Staff and Patient
    dir_staff = await client.get(
        "/api/v1/auth/admin/directory",
        params={"account_type": "staff", "search": "Bontu"},
        headers=admin_auth_headers,
    )
    assert dir_staff.status_code == 200
    staff_items = dir_staff.json()["items"]
    assert len(staff_items) == 1
    assert staff_items[0]["username"] == staff_username
    assert staff_items[0]["saved_password"] == "NurseInitialPass2026!"
    assert "Jimma Univ" in (staff_items[0]["biography"] or "")

    dir_pat = await client.get(
        "/api/v1/auth/admin/directory",
        params={"account_type": "patient", "search": "FAN-8844-1122-3399"},
        headers=admin_auth_headers,
    )
    assert dir_pat.status_code == 200
    pat_items = dir_pat.json()["items"]
    assert len(pat_items) == 1
    assert pat_items[0]["id"] == pat_uid
    assert pat_items[0]["saved_password"] == "PatientSecret2026!"
    assert pat_items[0]["city"] == "Mettu"

    # Admin edits both Staff & Patient biography/profile + saved password directly
    edit_staff = await client.patch(
        f"/api/v1/auth/admin/users/{staff_uid}",
        json={
            "department": "Emergency ICU",
            "biography": "Senior ICU Charge Nurse — Mettu Karl Referral Hospital.",
            "phone_number": "+251933998877",
            "new_password": "DirectEditedPw2026!",
        },
        headers=admin_auth_headers,
    )
    assert edit_staff.status_code == 200
    assert edit_staff.json()["department"] == "Emergency ICU"
    assert edit_staff.json()["saved_password"] == "DirectEditedPw2026!"
    assert "Senior ICU Charge Nurse" in (edit_staff.json()["biography"] or "")

    staff_direct_edit_login = await client.post(
        "/api/v1/auth/login",
        json={"username": staff_username, "password": "DirectEditedPw2026!"},
    )
    assert staff_direct_edit_login.status_code == 200

    edit_pat = await client.patch(
        f"/api/v1/auth/admin/users/{pat_uid}",
        json={
            "city": "Gore",
            "biography": "Outpatient hypertension follow-up patient; allergic to penicillin.",
        },
        headers=admin_auth_headers,
    )
    assert edit_pat.status_code == 200
    assert edit_pat.json()["city"] == "Gore"
    assert "hypertension" in (edit_pat.json()["biography"] or "")

    # 3. Admin resets forgotten passwords for Staff and Patient
    reset_staff = await client.post(
        f"/api/v1/auth/admin/users/{staff_uid}/reset-password",
        json={"new_password": "RecoveredNurse2026!", "clear_lockout": True, "reason": "Staff forgot password"},
        headers=admin_auth_headers,
    )
    assert reset_staff.status_code == 200
    assert reset_staff.json()["username"] == staff_username

    staff_new_login = await client.post(
        "/api/v1/auth/login",
        json={"username": staff_username, "password": "RecoveredNurse2026!"},
    )
    assert staff_new_login.status_code == 200

    # Patient wrong password fails strictly (no demo OTP bypass for registered patient!)
    pat_bad = await client.post(
        "/api/v1/auth/patient/login",
        json={"identifier": "FAN-8844-1122-3399", "password_or_otp": "123456"},
    )
    assert pat_bad.status_code == 401

    reset_pat = await client.post(
        f"/api/v1/auth/admin/users/{pat_uid}/reset-password",
        json={"clear_lockout": True, "reason": "Patient forgot password at reception"},
        headers=admin_auth_headers,
    )
    assert reset_pat.status_code == 200
    pat_temp_pw = reset_pat.json()["temporary_password"]

    pat_recovered_login = await client.post(
        "/api/v1/auth/patient/login",
        json={"identifier": "FAN-8844-1122-3399", "password_or_otp": pat_temp_pw},
    )
    assert pat_recovered_login.status_code == 200

    # 4. Strict blocking of unknown strangers & Admin-blocked users
    unknown_staff = await client.post(
        "/api/v1/auth/login",
        json={"username": "completely_unknown_intruder", "password": "SomePassword2026!"},
    )
    assert unknown_staff.status_code == 401

    unknown_patient = await client.post(
        "/api/v1/auth/patient/login",
        headers={"X-Forwarded-For": "10.50.1.99"},
        json={"identifier": "+251987654321", "password_or_otp": "123456"},
    )
    assert unknown_patient.status_code == 401

    # Block patient & confirm blocked patient is denied
    block_pat = await client.patch(
        f"/api/v1/auth/admin/users/{pat_uid}",
        json={"is_active": False},
        headers=admin_auth_headers,
    )
    assert block_pat.status_code == 200
    assert block_pat.json()["is_active"] is False

    blocked_pat_login = await client.post(
        "/api/v1/auth/patient/login",
        json={"identifier": "FAN-8844-1122-3399", "password_or_otp": pat_temp_pw},
    )
    assert blocked_pat_login.status_code == 403



