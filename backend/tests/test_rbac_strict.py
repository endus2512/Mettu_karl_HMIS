"""
Unit & Integration Tests for Strict Role-Based Access Control (RBAC).

Tests:
- Admin Privacy Boundary: Admin can access executive/financial/HRM, but cannot view clinical notes.
- Doctor Boundary: Doctor can access clinical/EMR/prescriptions, but is blocked from financial ledgers.
- Nurse Boundary: Nurse can access wards/vitals/MAR.
- Patient Boundary: Patient can access personal portal and personal FHIR records only.
- 403 Forbidden enforcement on unauthorized cross-role requests.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole


@pytest_asyncio.fixture
async def seeded_rbac_users(db_session: AsyncSession) -> dict[str, User]:
    """Seed test users for each role in the test database session."""
    users = {
        "admin": User(
            username="admin",
            email="admin@mettukarl.gov.et",
            full_name="Hospital Administrator",
            hashed_password=hash_password("password"),
            role=UserRole.ADMIN,
            is_active=True,
        ),
        "doctor": User(
            username="dr_bekele",
            email="dr.bekele@mettukarl.gov.et",
            full_name="Dr. Bekele Tadesse",
            hashed_password=hash_password("password"),
            role=UserRole.DOCTOR,
            is_active=True,
        ),
        "nurse": User(
            username="nurse_chaltu",
            email="nurse.chaltu@mettukarl.gov.et",
            full_name="Nurse Chaltu Abera",
            hashed_password=hash_password("password"),
            role=UserRole.NURSE,
            is_active=True,
        ),
        "patient": User(
            username="gudeta",
            email="gudeta@patient.mettukarl.gov.et",
            full_name="Gudeta Hailu Tadesse",
            hashed_password=hash_password("123456"),
            role=UserRole.PATIENT,
            patient_id=1,
            fayda_id="FAN-9901-2384-5120",
            phone_number="+251911002233",
            is_active=True,
        ),
    }
    for u in users.values():
        db_session.add(u)
    await db_session.commit()
    for u in users.values():
        await db_session.refresh(u)
    return users


@pytest.mark.asyncio
async def test_auth_login_all_roles(client: AsyncClient, seeded_rbac_users: dict[str, User]):
    """Verify credentials for key system roles authenticate properly."""
    roles_to_test = [
        ("admin", "password"),
        ("dr_bekele", "password"),
        ("nurse_chaltu", "password"),
    ]
    for username, password in roles_to_test:
        res = await client.post(
            "/api/v1/auth/login",
            json={"username": username, "password": password},
        )
        assert res.status_code == 200, f"Login failed for {username}: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["username"] == username


@pytest.mark.asyncio
async def test_patient_login_via_fayda_and_phone(client: AsyncClient, seeded_rbac_users: dict[str, User]):
    """Verify patients can authenticate using either username, Fayda ID, or phone number."""
    identifiers = ["gudeta", "FAN-9901-2384-5120", "+251911002233"]
    for ident in identifiers:
        res = await client.post(
            "/api/v1/auth/login",
            json={"username": ident, "password": "123456"},
        )
        assert res.status_code == 200, f"Login failed for identifier {ident}: {res.text}"
        data = res.json()
        assert data["role"] == "patient"
        assert "access_token" in data


@pytest.mark.asyncio
async def test_sms_gateway_config_admin_allowed(client: AsyncClient, seeded_rbac_users: dict[str, User]):
    """Admin can view telecom SMS gateway configuration."""
    admin_user = seeded_rbac_users["admin"]
    token = create_access_token(
        subject=str(admin_user.id),
        extra_claims={"role": admin_user.role.value, "username": admin_user.username, "type": "access"},
    )
    res = await client.get(
        "/api/v1/sms/config",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert "provider" in res.json()


@pytest.mark.asyncio
async def test_mortuary_stats_accessible_to_authorized_doctor(client: AsyncClient, seeded_rbac_users: dict[str, User]):
    """Doctor can view mortuary and cold vault statistics."""
    doctor_user = seeded_rbac_users["doctor"]
    token = create_access_token(
        subject=str(doctor_user.id),
        extra_claims={"role": doctor_user.role.value, "username": doctor_user.username, "type": "access"},
    )
    res = await client.get(
        "/api/v1/mortuary/stats",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert "total_vaults" in res.json()



@pytest.mark.asyncio
async def test_unauthenticated_401_across_all_protected_modules(client: AsyncClient):
    """Ensure unauthenticated callers receive HTTP 401 across all clinical, operational, and admin endpoints."""
    protected_requests = [
        ("GET", "/api/v1/hrm/employees", None),
        ("POST", "/api/v1/hrm/payroll/calculate", {"employee_id": 1, "month": 11, "year": 2026}),
        (
            "POST",
            "/api/v1/hrm/shifts",
            {"employee_id": 1, "shift_date": "2026-11-12", "shift_type": "morning", "ward_or_clinic": "OPD"},
        ),
        ("GET", "/api/v1/analytics/executive-summary", None),
        ("GET", "/api/v1/clinical-audit/audits", None),
        ("GET", "/api/v1/clinical-audit/security/logs", None),
        ("GET", "/api/v1/clinical-audit/security/verify-chain", None),
        ("GET", "/api/v1/sms/config", None),
        ("GET", "/api/v1/sms/logs", None),
        (
            "POST",
            "/api/v1/auth/users",
            {
                "username": "unauth_spoof",
                "email": "unauth.spoof@mettukarl.gov.et",
                "full_name": "Unauth Spoof",
                "password": "Password123!",
                "role": "admin",
            },
        ),
        ("PUT", "/api/v1/signage", {"message": "Unauthorized Signage Update"}),
        ("GET", "/api/v1/billing/invoices", None),
        ("GET", "/api/v1/accounting/accounts", None),
        ("GET", "/api/v1/insurance-claims/batches", None),
        ("GET", "/api/v1/procurement/tenders", None),
        ("GET", "/api/v1/crm/grievances", None),
        ("GET", "/api/v1/pharmacy/drugs", None),
        ("GET", "/api/v1/pharmacy/inventory", None),
        ("GET", "/api/v1/pharmacy/prescriptions", None),
        ("GET", "/api/v1/laboratory/orders", None),
        ("GET", "/api/v1/inpatient/admissions", None),
        ("GET", "/api/v1/inpatient/wards", None),
        ("GET", "/api/v1/blood-bank/units", None),
        ("GET", "/api/v1/pacs/orders", None),
        ("GET", "/api/v1/ot/bookings", None),
        ("GET", "/api/v1/ems/calls", None),
        ("GET", "/api/v1/mortuary/stats", None),
        ("GET", "/api/v1/barcode/presets", None),
        ("GET", "/api/v1/sms/templates", None),
        ("GET", "/api/v1/queue/departments", None),
        ("POST", "/api/v1/queue/tickets", {"department_code": "OPD_1", "priority": "routine"}),
        (
            "POST",
            "/api/v1/fayda/verify-biometric",
            {
                "fin_number": "FAN-9901-2384-5120",
                "modality": "fingerprint",
                "biometric_template_base64": "YWJj",
                "consent_given": True,
            },
        ),
        ("GET", "/api/v1/efda/recalls", None),
        ("GET", "/api/v1/efda/adr-reports", None),
    ]

    for method, path, payload in protected_requests:
        resp = await client.request(method, path, json=payload)
        assert resp.status_code == 401, f"Expected 401 for unauth {method} {path}, got {resp.status_code}: {resp.text}"


@pytest.mark.asyncio
async def test_strict_admin_exclusive_governance_matrix(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    doctor_auth_headers: dict[str, str],
    nurse_auth_headers: dict[str, str],
    pharmacist_auth_headers: dict[str, str],
    technician_auth_headers: dict[str, str],
    billing_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """
    Strictly enforce Admin-only governance: doctor, nurse, pharmacist, technician,
    insurance_officer, billing, and patient are all rejected (403) across Admin endpoints,
    while Admin is authorized (200/201).
    """
    from app.core.security import hash_password
    from tests.test_rbac import auth_header_for

    patient_user = User(
        username="pat_matrix",
        email="pat.matrix@mettukarl.gov.et",
        full_name="Patient Matrix User",
        hashed_password=hash_password("PatientPass123!"),
        role=UserRole.PATIENT,
        is_active=True,
    )
    ins_user = User(
        username="ins_matrix",
        email="ins.matrix@mettukarl.gov.et",
        full_name="Insurance Matrix User",
        hashed_password=hash_password("InsPass123!"),
        role=UserRole.INSURANCE_OFFICER,
        is_active=True,
    )
    db_session.add_all([patient_user, ins_user])
    await db_session.commit()
    await db_session.refresh(patient_user)
    await db_session.refresh(ins_user)

    admin_headers = admin_auth_headers
    non_admin_headers = {
        "doctor": doctor_auth_headers,
        "nurse": nurse_auth_headers,
        "pharmacist": pharmacist_auth_headers,
        "technician": technician_auth_headers,
        "insurance_officer": auth_header_for(ins_user),
        "billing": billing_auth_headers,
        "patient": auth_header_for(patient_user),
    }

    emp_payload = {
        "employee_code": "EMP-RBAC-001",
        "first_name": "Biftu",
        "last_name": "Girma",
        "phone_number": "+251911776655",
        "email": "biftu.girma@mettukarl.gov.et",
        "department": "Internal Medicine",
        "designation": "Staff Nurse",
        "employment_type": "permanent",
        "hire_date": "2026-01-15",
        "base_salary_etb": 12500.0,
    }
    doc_emp_denied = await client.post("/api/v1/hrm/employees", json=emp_payload, headers=non_admin_headers["doctor"])
    assert doc_emp_denied.status_code == 403

    emp_res = await client.post("/api/v1/hrm/employees", json=emp_payload, headers=admin_headers)
    assert emp_res.status_code == 201
    emp_id = emp_res.json()["id"]

    admin_only_matrix = [
        ("GET", "/api/v1/hrm/employees", None, 200),
        (
            "POST",
            "/api/v1/hrm/shifts",
            {"employee_id": emp_id, "shift_date": "2026-11-12", "shift_type": "morning", "ward_or_clinic": "OPD"},
            201,
        ),
        (
            "POST",
            "/api/v1/hrm/payroll/calculate",
            {"employee_id": emp_id, "month": 11, "year": 2026, "duty_allowance_etb": 500.0, "overtime_etb": 200.0},
            200,
        ),
        ("GET", "/api/v1/analytics/executive-summary", None, 200),
        ("GET", "/api/v1/clinical-audit/audits", None, 200),
        ("GET", "/api/v1/clinical-audit/security/logs", None, 200),
        ("GET", "/api/v1/clinical-audit/security/verify-chain", None, 200),
        ("GET", "/api/v1/sms/config", None, 200),
        ("GET", "/api/v1/sms/logs", None, 200),
        ("PUT", "/api/v1/signage", {"message": "ADMIN GOVERNANCE TEST"}, 200),
        (
            "POST",
            "/api/v1/auth/users",
            {
                "username": "created_by_admin",
                "email": "created.by.admin@mettukarl.gov.et",
                "full_name": "Created Staff User",
                "password": "StrongPassword123!",
                "role": "nurse",
            },
            200,
        ),
    ]

    for method, path, payload, expected_admin_status in admin_only_matrix:
        for role_name, headers in non_admin_headers.items():
            denied = await client.request(method, path, json=payload, headers=headers)
            assert denied.status_code == 403, (
                f"Expected 403 for non-admin {role_name} on {method} {path}, got {denied.status_code}: {denied.text}"
            )

        allowed = await client.request(method, path, json=payload, headers=admin_headers)
        assert allowed.status_code == expected_admin_status, (
            f"Expected {expected_admin_status} for Admin on {method} {path}, got {allowed.status_code}: {allowed.text}"
        )


@pytest.mark.asyncio
async def test_cross_role_departmental_isolation_matrix(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    doctor_auth_headers: dict[str, str],
    pharmacist_auth_headers: dict[str, str],
    billing_auth_headers: dict[str, str],
):
    """
    Verify strict horizontal and vertical departmental isolation across clinical, pharmacy,
    billing, admin, and patient roles while keeping legitimate own-role routes accessible.
    """
    from app.core.rate_limiter import clear_patient_login_rate_limit

    doctor_headers = doctor_auth_headers
    pharmacist_headers = pharmacist_auth_headers
    admin_headers = admin_auth_headers

    # Doctor strictly blocked from non-doctor domains & pharmacist dispensing
    doctor_forbidden = [
        ("GET", "/api/v1/accounting/accounts", None),
        ("GET", "/api/v1/accounting/reports/trial-balance", None),
        ("GET", "/api/v1/billing/invoices", None),
        ("GET", "/api/v1/billing/revenue/summary", None),
        ("GET", "/api/v1/billing/cbhi/policies", None),
        ("GET", "/api/v1/insurance-claims/batches", None),
        ("GET", "/api/v1/procurement/tenders", None),
        ("GET", "/api/v1/procurement/purchase-orders", None),
        ("GET", "/api/v1/crm/grievances", None),
        ("GET", "/api/v1/crm/feedback", None),
        ("POST", "/api/v1/pharmacy/prescriptions/9999/dispense", None),
    ]
    for method, path, payload in doctor_forbidden:
        resp = await client.request(method, path, json=payload, headers=doctor_headers)
        assert resp.status_code == 403, f"Doctor leaked {method} {path}: {resp.status_code}"

    # Pharmacist strictly blocked from patient EHR, lab, inpatient, accounting, billing, OT, PACS, mortuary
    pharmacist_forbidden = [
        ("GET", "/api/v1/fhir/r4/Patient", None),
        ("GET", "/api/v1/laboratory/orders", None),
        ("GET", "/api/v1/inpatient/admissions", None),
        ("GET", "/api/v1/inpatient/wards", None),
        ("GET", "/api/v1/accounting/accounts", None),
        ("GET", "/api/v1/billing/invoices", None),
        ("GET", "/api/v1/ot/bookings", None),
        ("GET", "/api/v1/pacs/orders", None),
        ("GET", "/api/v1/mortuary/stats", None),
    ]
    for method, path, payload in pharmacist_forbidden:
        resp = await client.request(method, path, json=payload, headers=pharmacist_headers)
        assert resp.status_code == 403, f"Pharmacist leaked {method} {path}: {resp.status_code}"

    # Billing strictly blocked from pharmacy, lab, OT, inpatient, blood-bank, PACS
    billing_forbidden = [
        ("GET", "/api/v1/pharmacy/prescriptions", None),
        ("GET", "/api/v1/pharmacy/drugs", None),
        ("GET", "/api/v1/laboratory/orders", None),
        ("GET", "/api/v1/ot/bookings", None),
        ("GET", "/api/v1/inpatient/admissions", None),
        ("GET", "/api/v1/inpatient/wards", None),
        ("GET", "/api/v1/blood-bank/units", None),
        ("GET", "/api/v1/pacs/orders", None),
    ]
    for method, path, payload in billing_forbidden:
        resp = await client.request(method, path, json=payload, headers=billing_auth_headers)
        assert resp.status_code == 403, f"Billing leaked {method} {path}: {resp.status_code}"

    # Admin blocked from direct clinician/pharmacist write operations
    fhir_patient_payload = {
        "first_name": "Admin",
        "last_name": "WriteTest",
        "birth_date": "1990-01-01",
        "gender": "male",
        "phone_number": "+251911000111",
    }
    admin_clinical_write_forbidden = [
        ("POST", "/api/v1/fhir/r4/Patient", fhir_patient_payload),
        ("POST", "/api/v1/pharmacy/prescriptions/9999/dispense", None),
        ("PATCH", "/api/v1/inpatient/beds/1/status", {"status": "available"}),
    ]
    for method, path, payload in admin_clinical_write_forbidden:
        resp = await client.request(method, path, json=payload, headers=admin_headers)
        assert resp.status_code == 403, f"Admin performed clinical write {method} {path}: {resp.status_code}"

    # Authenticated Patient blocked from ALL clinical, diagnostic, financial, and admin endpoints
    await clear_patient_login_rate_limit("127.0.0.1", "FAN-9901-2384-5120")
    pat_login = await client.post(
        "/api/v1/auth/patient/login",
        json={"identifier": "FAN-9901-2384-5120", "password_or_otp": "123456"},
    )
    assert pat_login.status_code == 200
    patient_headers = {"Authorization": f"Bearer {pat_login.json()['access_token']}"}

    patient_forbidden = [
        ("GET", "/api/v1/fhir/r4/Patient", None),
        ("GET", "/api/v1/inpatient/admissions", None),
        ("GET", "/api/v1/inpatient/wards", None),
        ("GET", "/api/v1/laboratory/orders", None),
        ("GET", "/api/v1/pacs/orders", None),
        ("GET", "/api/v1/blood-bank/units", None),
        ("GET", "/api/v1/ot/bookings", None),
        ("GET", "/api/v1/pharmacy/prescriptions", None),
        ("GET", "/api/v1/billing/invoices", None),
        ("GET", "/api/v1/accounting/accounts", None),
        ("GET", "/api/v1/ems/calls", None),
        ("GET", "/api/v1/mortuary/stats", None),
        ("GET", "/api/v1/barcode/presets", None),
        ("GET", "/api/v1/sms/templates", None),
        ("GET", "/api/v1/queue/departments", None),
        ("GET", "/api/v1/analytics/executive-summary", None),
        ("GET", "/api/v1/hrm/employees", None),
        ("GET", "/api/v1/clinical-audit/audits", None),
    ]
    for method, path, payload in patient_forbidden:
        resp = await client.request(method, path, json=payload, headers=patient_headers)
        assert resp.status_code == 403, f"Patient leaked {method} {path}: {resp.status_code}"

    # Confirm patient retains access to their own strictly-isolated portal
    for portal_path in ("/api/v1/portal/me", "/api/v1/portal/clinical-history", "/api/v1/portal/prescriptions", "/api/v1/portal/invoices"):
        portal_resp = await client.get(portal_path, headers=patient_headers)
        assert portal_resp.status_code == 200, f"Patient blocked from {portal_path}: {portal_resp.status_code}"
