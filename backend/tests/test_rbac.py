"""
Test suite for Role-Based Access Control (RBAC) across Mettu Karl HIS.

Verifies:
1. Role-specific JWT generation (embedded role claims).
2. 403 Forbidden enforcement when users attempt unauthorized domain actions (e.g., Doctor accessing Accounting/HRM).
3. Patient clinical privacy masking for Administrative role.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.patient import Gender, Patient
from app.models.user import User, UserRole


@pytest.fixture
async def seeded_rbac_users(db_session: AsyncSession) -> dict[str, User]:
    """Seed users with distinct roles."""
    roles_data = [
        ("dr_karl", "Doctor Karl", UserRole.DOCTOR, "DoctorPass123!"),
        ("admin_user", "Admin Diriba", UserRole.ADMIN, "AdminPass123!"),
        ("nurse_chaltu", "Nurse Chaltu", UserRole.NURSE, "NursePass123!"),
        ("pharm_tolasa", "Pharm Tolasa", UserRole.PHARMACIST, "PharmPass123!"),
        ("ins_fatuma", "Officer Fatuma", UserRole.INSURANCE_OFFICER, "InsurePass123!"),
        ("tech_gemechu", "Tech Gemechu", UserRole.TECHNICIAN, "TechPass123!"),
    ]
    users = {}
    for username, full_name, role, password in roles_data:
        user = User(
            username=username,
            email=f"{username}@mettukarl.gov.et",
            full_name=full_name,
            hashed_password=hash_password(password),
            role=role,
            is_active=True,
        )
        db_session.add(user)
        users[username] = user

    await db_session.commit()
    for u in users.values():
        await db_session.refresh(u)
    return users


def auth_header_for(user: User) -> dict[str, str]:
    """Generate Authorization header with role embedded."""
    token = create_access_token(
        subject=user.id,
        extra_claims={
            "role": user.role.value,
            "username": user.username,
            "full_name": user.full_name,
        },
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_doctor_forbidden_from_accounting(client: AsyncClient, seeded_rbac_users: dict[str, User]):
    """Ensure DOCTOR receives 403 Forbidden when accessing bank/ledger accounts."""
    doctor = seeded_rbac_users["dr_karl"]
    headers = auth_header_for(doctor)

    response = await client.get("/api/v1/accounting/accounts", headers=headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


@pytest.mark.asyncio
async def test_doctor_forbidden_from_hrm_payroll(client: AsyncClient, seeded_rbac_users: dict[str, User]):
    """Ensure DOCTOR receives 403 Forbidden when attempting to access staff employee payroll."""
    doctor = seeded_rbac_users["dr_karl"]
    headers = auth_header_for(doctor)

    response = await client.get("/api/v1/hrm/employees", headers=headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


@pytest.mark.asyncio
async def test_admin_allowed_in_hrm_payroll(client: AsyncClient, seeded_rbac_users: dict[str, User]):
    """Ensure ADMIN is permitted to list HRM employees."""
    admin = seeded_rbac_users["admin_user"]
    headers = auth_header_for(admin)

    response = await client.get("/api/v1/hrm/employees", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_technician_forbidden_from_cdss(client: AsyncClient, seeded_rbac_users: dict[str, User]):
    """Ensure TECHNICIAN receives 403 Forbidden when attempting to run CDSS prescription checks."""
    tech = seeded_rbac_users["tech_gemechu"]
    headers = auth_header_for(tech)

    response = await client.post(
        "/api/v1/cdss/check-prescription",
        json={"patient_id": 1, "drug_names": ["Amoxicillin"]},
        headers=headers,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_patient_clinical_confidentiality_masking(
    client: AsyncClient,
    seeded_rbac_users: dict[str, User],
    db_session: AsyncSession,
):
    """
    Ensure that when an Administrator searches FHIR patients,
    identifying patient clinical data is masked with [PROTECTED] (Executive BI overview only).
    """
    # Seed a test patient
    from datetime import date
    patient = Patient(
        fhir_id="pat-rbac-confidential-001",
        mrn="MKH-2026-9999",
        first_name="Gudeta",
        last_name="Tadesse",
        gender=Gender.MALE,
        birth_date=date(1985, 4, 12),
        phone_number="+251911223344",
        city="Mettu",
        state_province="Oromia",
    )
    db_session.add(patient)
    await db_session.commit()

    admin = seeded_rbac_users["admin_user"]
    headers = auth_header_for(admin)

    response = await client.get("/api/v1/fhir/r4/Patient", headers=headers)
    assert response.status_code == 200
    bundle = response.json()
    assert bundle["total"] >= 1
    # Check that the first entry has masked name for admin
    first_resource = bundle["entry"][0]["resource"]
    assert first_resource["name"][0]["family"] == "[PROTECTED]"
    assert first_resource["telecom"] == []

    # But when a DOCTOR searches, full clinical names are visible
    doctor = seeded_rbac_users["dr_karl"]
    doc_headers = auth_header_for(doctor)
    doc_response = await client.get("/api/v1/fhir/r4/Patient", headers=doc_headers)
    assert doc_response.status_code == 200
    doc_bundle = doc_response.json()
    doc_resource = doc_bundle["entry"][0]["resource"]
    assert doc_resource["name"][0]["family"] == "Tadesse"


@pytest.mark.asyncio
async def test_patient_authentication_and_portal_isolation(client: AsyncClient, db_session: AsyncSession):
    """
    Test:
    1. Dedicated Patient Login via Fayda Digital ID / OTP.
    2. Patient can access their own Portal profile and prescriptions.
    3. Patient receives 403 Forbidden when trying to access staff/hospital endpoints (Accounting/HRM).
    """
    # 1. Patient Login via Fayda ID
    login_resp = await client.post(
        "/api/v1/auth/patient/login",
        json={
            "identifier": "FAN-9901-2384-5120",
            "password_or_otp": "PatientPass2026!",
        },
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert token_data["role"] == "patient"
    assert "access_token" in token_data
    token = token_data["access_token"]
    patient_headers = {"Authorization": f"Bearer {token}"}

    # 2. Patient can access their own Portal endpoints
    profile_resp = await client.get("/api/v1/portal/me", headers=patient_headers)
    assert profile_resp.status_code == 200
    profile = profile_resp.json()
    assert profile["blood_group"] == "O+"
    assert "Penicillin" in profile["allergies"]

    presc_resp = await client.get("/api/v1/portal/prescriptions", headers=patient_headers)
    assert presc_resp.status_code == 200
    assert len(presc_resp.json()) >= 1

    inv_resp = await client.get("/api/v1/portal/invoices", headers=patient_headers)
    assert inv_resp.status_code == 200
    assert len(inv_resp.json()) >= 1

    queue_resp = await client.get("/api/v1/portal/queue-status", headers=patient_headers)
    assert queue_resp.status_code == 200
    assert queue_resp.json()["has_active_token"] is True

    # 3. Patient is STRICTLY FORBIDDEN (403) from accessing staff / administrative endpoints
    forbidden_accounting = await client.get("/api/v1/accounting/accounts", headers=patient_headers)
    assert forbidden_accounting.status_code == 403

    forbidden_hrm = await client.get("/api/v1/hrm/employees", headers=patient_headers)
    assert forbidden_hrm.status_code == 403

    forbidden_cdss = await client.post(
        "/api/v1/cdss/check-prescription",
        json={"patient_id": 1, "drug_names": ["Ceftriaxone"]},
        headers=patient_headers,
    )
    assert forbidden_cdss.status_code == 403

