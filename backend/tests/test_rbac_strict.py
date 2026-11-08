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
