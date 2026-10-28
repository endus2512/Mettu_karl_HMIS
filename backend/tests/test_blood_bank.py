"""
Unit and integration tests for Blood Bank & Crossmatch management.
"""
from datetime import date, datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blood_bank import BloodDonor, BloodGroup, BloodUnit, BloodUnitStatus, ComponentType


@pytest.mark.asyncio
async def test_blood_unit_registration_and_inventory_summary(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test receiving blood units and querying blood bank stock levels."""
    # 1. Add Blood Units
    unit1_payload = {
        "unit_number": "MKH-BB-2026-001",
        "blood_group": "O_POS",
        "component_type": "PRBC",
        "volume_ml": 450,
        "collected_date": str(date.today()),
        "expiry_date": str(date.today() + timedelta(days=35)),
        "storage_location": "Walk-In Blood Refrigerator #1",
        "tested_negative_hiv": True,
        "tested_negative_hep_b": True,
        "tested_negative_hep_c": True,
        "tested_negative_syphilis": True,
    }
    res1 = await client.post("/api/v1/blood-bank/units", json=unit1_payload, headers=doctor_auth_headers)
    assert res1.status_code == 201
    assert res1.json()["unit_number"] == "MKH-BB-2026-001"

    # Add second unit with critical O_NEG
    unit2_payload = {
        "unit_number": "MKH-BB-2026-002",
        "blood_group": "O_NEG",
        "component_type": "PRBC",
        "volume_ml": 450,
        "collected_date": str(date.today()),
        "expiry_date": str(date.today() + timedelta(days=35)),
        "storage_location": "Walk-In Blood Refrigerator #1",
    }
    res2 = await client.post("/api/v1/blood-bank/units", json=unit2_payload, headers=doctor_auth_headers)
    assert res2.status_code == 201

    # 2. Query Real-Time Inventory Summary
    res_summary = await client.get("/api/v1/blood-bank/stock-summary", headers=doctor_auth_headers)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert len(summary) >= 2
    o_pos = next(item for item in summary if item["blood_group"] == "O_POS")
    assert o_pos["units_available"] >= 1


@pytest.mark.asyncio
async def test_blood_crossmatch_compatibility(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test crossmatch testing logic between donor unit and patient blood group."""
    # Register O_NEG unit (Universal PRBC donor)
    unit = BloodUnit(
        unit_number="MKH-BB-2026-ONEG",
        blood_group=BloodGroup.O_NEG,
        component_type=ComponentType.PRBC,
        volume_ml=450,
        collected_date=date.today(),
        expiry_date=date.today() + timedelta(days=35),
        storage_location="Emergency Shelf A",
        status=BloodUnitStatus.AVAILABLE,
    )
    db_session.add(unit)
    await db_session.commit()
    await db_session.refresh(unit)

    # Crossmatch with A_POS patient -> Compatible!
    match_payload = {
        "blood_unit_id": unit.id,
        "patient_id": 1,
        "patient_blood_group": "A_POS",
        "crossmatch_method": "Indirect Antiglobulin Test (IAT)",
    }
    res = await client.post("/api/v1/blood-bank/crossmatch", json=match_payload, headers=doctor_auth_headers)
    assert res.status_code == 200
    match_data = res.json()
    assert match_data["is_compatible"] is True

    # Now register B_POS unit
    unit_b = BloodUnit(
        unit_number="MKH-BB-2026-BPOS",
        blood_group=BloodGroup.B_POS,
        component_type=ComponentType.PRBC,
        volume_ml=450,
        collected_date=date.today(),
        expiry_date=date.today() + timedelta(days=35),
        storage_location="Shelf B",
        status=BloodUnitStatus.AVAILABLE,
    )
    db_session.add(unit_b)
    await db_session.commit()
    await db_session.refresh(unit_b)

    # Crossmatch B_POS unit with A_POS patient -> Incompatible!
    incompatible_payload = {
        "blood_unit_id": unit_b.id,
        "patient_id": 1,
        "patient_blood_group": "A_POS",
        "crossmatch_method": "Indirect Antiglobulin Test (IAT)",
    }
    res_incomp = await client.post("/api/v1/blood-bank/crossmatch", json=incompatible_payload, headers=doctor_auth_headers)
    assert res_incomp.status_code == 200
    assert res_incomp.json()["is_compatible"] is False
