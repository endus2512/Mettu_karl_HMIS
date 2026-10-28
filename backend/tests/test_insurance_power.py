"""
Tests for CBHI/EHIA Insurance Claims and Power Grid / Generator Resilience.
"""
from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Gender, Patient


@pytest.mark.asyncio
async def test_cbhi_claims_batch_and_adjudication(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test Community-Based Health Insurance (CBHI) batch claims and adjudication."""
    patient = Patient(
        mrn="MKH-CBHI-003",
        first_name="Chaltu",
        last_name="Benti",
        birth_date=date(1992, 3, 10),
        gender=Gender.FEMALE,
        phone_number="+251911334455",
    )
    db_session.add(patient)
    await db_session.commit()
    await db_session.refresh(patient)

    # 1. Create Batch Header
    batch_payload = {
        "batch_number": "CBHI-METTU-2026-10",
        "insurance_type": "cbhi",
        "woreda_name": "Mettu Woreda Health Pool",
        "billing_period": "October 2026",
    }
    b_res = await client.post("/api/v1/insurance-claims/batches", json=batch_payload, headers=doctor_auth_headers)
    assert b_res.status_code == 201
    batch_id = b_res.json()["id"]

    # 2. Submit Patient Claim
    claim_payload = {
        "batch_id": batch_id,
        "patient_id": patient.id,
        "cbhi_id_number": "CBHI-MET-04-88912",
        "service_category": "Emergency C-Section & Inpatient Care",
        "total_cost_etb": 4200.0,
        "patient_copay_etb": 0.0,  # 100% CBHI covered
        "claimed_amount_etb": 4200.0,
    }
    c_res = await client.post("/api/v1/insurance-claims/claims", json=claim_payload, headers=doctor_auth_headers)
    assert c_res.status_code == 201
    claim_id = c_res.json()["id"]

    # 3. Adjudicate Claim
    adj_payload = {
        "status": "approved",
        "approved_amount_etb": 4200.0,
        "rejection_reason": None,
    }
    adj_res = await client.post(f"/api/v1/insurance-claims/claims/{claim_id}/adjudicate", json=adj_payload, headers=doctor_auth_headers)
    assert adj_res.status_code == 200
    assert adj_res.json()["status"] == "approved"
    assert adj_res.json()["approved_amount_etb"] == 4200.0

    # 4. Verify Batch Header Totals Recalculated
    batches_res = await client.get("/api/v1/insurance-claims/batches", headers=doctor_auth_headers)
    assert batches_res.status_code == 200
    b_updated = next(b for b in batches_res.json() if b["id"] == batch_id)
    assert b_updated["total_claims_count"] == 1
    assert b_updated["approved_amount_etb"] == 4200.0


@pytest.mark.asyncio
async def test_hospital_power_resilience_telemetry(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test facilities power telemetry ingestion and emergency power resilience alerts."""
    # 1. Ingest Telemetry: EEU Grid failed, Generator 1 running with sufficient fuel
    telemetry_payload = {
        "active_source": "diesel_generator_1",
        "eeu_grid_online": False,  # Blackout
        "eeu_grid_voltage": 0.0,
        "gen1_running": True,
        "gen1_fuel_percent": 82.0,
        "gen2_running": False,
        "gen2_fuel_percent": 90.0,
        "ats_state": "generator_engaged",
        "solar_battery_soc_percent": 91.0,
        "total_hospital_load_kw": 154.0,
        "server_room_ups_soc_percent": 98.0,
        "cold_chain_alarm": False,
    }
    t_res = await client.post("/api/v1/power-grid/telemetry", json=telemetry_payload, headers=doctor_auth_headers)
    assert t_res.status_code == 201

    # 2. Query Power Summary
    summary_res = await client.get("/api/v1/power-grid/summary", headers=doctor_auth_headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["current_source"] == "diesel_generator_1"
    assert summary["diesel_reserves_sufficient"] is True
    assert summary["critical_care_power_secure"] is True
    assert "Blackout" in summary["eeu_grid_status"]
