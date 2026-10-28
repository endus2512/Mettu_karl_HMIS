"""
Tests for EMS Ambulance Dispatch, Emergency Triage, Dietary, and Mortuary.
"""
from datetime import date, datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dietary import DietOrder, DietOrderStatus, DietType, MealType
from app.models.ems import Ambulance, DispatchStatus, EmergencyCall, TriageLevel
from app.models.mortuary import BodyVault, MortuaryRecord, VaultStatus


@pytest.mark.asyncio
async def test_emergency_call_triage_and_dispatch(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test 907 emergency hotline call intake, triage, and ambulance dispatch."""
    # 1. Register Ambulance
    amb_payload = {
        "call_sign": "AMB-04",
        "plate_number": "ET-3-88901",
        "vehicle_type": "advanced_life_support",
        "current_latitude": 8.2985,
        "current_longitude": 35.5841,
    }
    amb_res = await client.post("/api/v1/ems/ambulances", json=amb_payload, headers=doctor_auth_headers)
    assert amb_res.status_code == 201
    amb_id = amb_res.json()["id"]

    # 2. Intake 907 Emergency Call (RED - Resuscitation)
    call_payload = {
        "caller_phone": "+251911223344",
        "incident_location": "Mettu Roundabout, near Stadium",
        "emergency_description": "Multi-vehicle road collision, critical head injury",
        "triage_level": "RED",
    }
    call_res = await client.post("/api/v1/ems/calls", json=call_payload, headers=doctor_auth_headers)
    assert call_res.status_code == 201
    call_id = call_res.json()["id"]
    assert call_res.json()["dispatch_status"] == "pending"

    # 3. Dispatch Ambulance to Call
    dispatch_payload = {
        "emergency_call_id": call_id,
        "ambulance_id": amb_id,
    }
    disp_res = await client.post("/api/v1/ems/dispatch", json=dispatch_payload, headers=doctor_auth_headers)
    assert disp_res.status_code == 200
    disp_data = disp_res.json()
    assert disp_data["dispatch_status"] == "en_route"
    assert disp_data["assigned_ambulance_id"] == amb_id


@pytest.mark.asyncio
async def test_dietary_inpatient_meal_ordering(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test inpatient therapeutic diet order and meal delivery verification."""
    order_payload = {
        "patient_id": 1,
        "diet_type": "diabetic",
        "meal_type": "lunch",
        "ward_name": "Internal Medicine Ward A",
        "room_number": "Room 204",
        "special_instructions": "Low glycemic index, no refined sugar",
    }
    res = await client.post("/api/v1/dietary/orders", json=order_payload, headers=doctor_auth_headers)
    assert res.status_code == 201
    order_id = res.json()["id"]

    # Kitchen meal delivery
    delivery_payload = {
        "diet_order_id": order_id,
        "delivered_by": "Abebe Kitchen Staff",
        "notes": "Delivered warm to bedside table",
    }
    del_res = await client.post("/api/v1/dietary/deliveries", json=delivery_payload, headers=doctor_auth_headers)
    assert del_res.status_code == 201
    assert del_res.json()["diet_order_id"] == order_id


@pytest.mark.asyncio
async def test_mortuary_vault_allocation_and_release(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test deceased patient cold body vault allocation and legal release to next-of-kin."""
    # 1. Create Body Vault
    vault = BodyVault(
        vault_number="VLT-01",
        bay_name="Bay 1 Top",
        status=VaultStatus.VACANT,
        temperature_celsius=3.5,
    )
    db_session.add(vault)
    await db_session.commit()
    await db_session.refresh(vault)

    # 2. Intake Deceased Record
    record_payload = {
        "deceased_name": "Tadesse Gemechu",
        "date_of_death": str(date.today()),
        "time_of_death": "09:45:00",
        "cause_of_death": "Acute Myocardial Infarction",
        "certifying_physician": "Dr. Chala Worku",
        "death_certificate_number": "DC-MKH-2026-042",
        "vault_id": vault.id,
        "contact_kin_name": "Almaz Tadesse (Daughter)",
        "contact_kin_phone": "+251922334455",
    }
    rec_res = await client.post("/api/v1/mortuary/records", json=record_payload, headers=doctor_auth_headers)
    assert rec_res.status_code == 201
    rec_id = rec_res.json()["id"]

    # Verify vault became OCCUPIED
    vault_check = await client.get("/api/v1/mortuary/vaults", headers=doctor_auth_headers)
    v1 = next(v for v in vault_check.json() if v["id"] == vault.id)
    assert v1["status"] == "occupied"

    # 3. Release Body to Next of Kin
    rel_res = await client.post(f"/api/v1/mortuary/records/{rec_id}/release", headers=doctor_auth_headers)
    assert rel_res.status_code == 200
    assert rel_res.json()["released_to_kin"] is True
