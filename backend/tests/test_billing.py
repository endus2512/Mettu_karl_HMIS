"""
Tests for Billing, CBHI Insurance, and Telebirr integration.
"""
from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import CBHIPolicy
from app.models.patient import Gender, Patient


@pytest.mark.asyncio
async def test_create_invoice_standard(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Test standard private invoice calculation."""
    # Create patient
    p = Patient(
        mrn="MKH-TEST-001",
        fhir_id="fhir-test-001",
        first_name="Abdi",
        last_name="Gemeda",
        birth_date=date(1995, 1, 1),
        gender=Gender.MALE,
    )
    db_session.add(p)
    await db_session.commit()

    invoice_payload = {
        "patient_id": p.id,
        "items": [
            {"service_name": "General OPD Consultation", "quantity": 1, "unit_price": 100.0},
            {"service_name": "CBC Complete Blood Count", "quantity": 1, "unit_price": 250.0},
        ],
        "apply_cbhi": False,
    }

    res = await client.post("/api/v1/billing/invoices", json=invoice_payload, headers=doctor_auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["total_amount"] == 350.0
    assert data["patient_payable_amount"] == 350.0
    assert data["insurance_covered_amount"] == 0.0


@pytest.mark.asyncio
async def test_create_invoice_with_cbhi(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Test CBHI health insurance co-pay discount calculation."""
    p = Patient(
        mrn="MKH-TEST-002",
        fhir_id="fhir-test-002",
        first_name="Hawine",
        last_name="Dibaba",
        birth_date=date(1998, 3, 10),
        gender=Gender.FEMALE,
    )
    db_session.add(p)
    await db_session.commit()

    # Add active CBHI policy with 10% co-pay
    cbhi = CBHIPolicy(
        patient_id=p.id,
        household_number="HH-METTU-999",
        kebele="Kebele 02",
        woreda="Mettu",
        expiry_date=date(2027, 1, 1),
        co_pay_percentage=10.0,
        is_active=True,
    )
    db_session.add(cbhi)
    await db_session.commit()

    invoice_payload = {
        "patient_id": p.id,
        "items": [
            {"service_name": "Emergency Care", "quantity": 1, "unit_price": 1000.0},
        ],
        "apply_cbhi": True,
    }

    res = await client.post("/api/v1/billing/invoices", json=invoice_payload, headers=doctor_auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["total_amount"] == 1000.0
    assert data["patient_payable_amount"] == 100.0  # 10%
    assert data["insurance_covered_amount"] == 900.0 # 90%
