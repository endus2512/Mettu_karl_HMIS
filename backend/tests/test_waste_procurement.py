"""
Tests for Medical Waste, Incinerator, Procurement Tenders, and IRB / Academic Logbooks.
"""
from datetime import date, datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic import IRBStatus, ProcedureRole
from app.models.procurement import BidStatus, TenderStatus
from app.models.waste import DisposalMethod, WasteCategory


@pytest.mark.asyncio
async def test_medical_waste_and_incinerator_batches(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test biomedical hazardous waste segregation and thermal destruction cycle."""
    # 1. Log Infectious Waste (Yellow Bag)
    waste_payload = {
        "department": "Main Operation Theatre",
        "category": "yellow_infectious",
        "weight_kg": 18.5,
        "handler_name": "Nurse Desta",
        "disposal_method": "incineration",
    }
    w_res = await client.post("/api/v1/waste/logs", json=waste_payload, headers=doctor_auth_headers)
    assert w_res.status_code == 201
    waste_data = w_res.json()
    assert waste_data["waste_code"].startswith("MW-")
    assert waste_data["weight_kg"] == 18.5

    # 2. Log Incinerator High-Temperature Burn Batch
    inc_payload = {
        "total_weight_kg": 120.0,
        "chamber_1_temp_celsius": 880.0,
        "chamber_2_temp_celsius": 1150.0,
        "burn_duration_min": 110,
        "operator_name": "Technician Haile",
    }
    inc_res = await client.post("/api/v1/waste/incinerator/batches", json=inc_payload, headers=doctor_auth_headers)
    assert inc_res.status_code == 201
    assert inc_res.json()["batch_code"].startswith("INC-")
    assert inc_res.json()["emission_scrubber_normal"] is True


@pytest.mark.asyncio
async def test_procurement_tender_and_vendor_bidding(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test competitive procurement tender publishing and vendor bidding."""
    # 1. Publish Hospital Tender
    tender_payload = {
        "tender_number": "TND-MKH-2026-09",
        "title": "Procurement of High-Resolution Ultrasound Transducers",
        "category": "Biomedical Equipment",
        "estimated_budget_etb": 2400000.0,
        "submission_deadline": str(date.today() + timedelta(days=21)),
        "specifications_summary": "3x Convex 3.5MHz and 2x Linear 7.5MHz probes compatible with GE Voluson",
    }
    t_res = await client.post("/api/v1/procurement/tenders", json=tender_payload, headers=doctor_auth_headers)
    assert t_res.status_code == 201
    tender_id = t_res.json()["id"]

    # 2. Submit Vendor Bid
    bid_payload = {
        "tender_id": tender_id,
        "vendor_name": "East Africa MedTech PLC",
        "vendor_tin": "0099881122",
        "contact_email": "tenders@eamedtech.et",
        "quoted_amount_etb": 2250000.0,
        "delivery_timeline_days": 25,
    }
    b_res = await client.post("/api/v1/procurement/bids", json=bid_payload, headers=doctor_auth_headers)
    assert b_res.status_code == 201
    assert b_res.json()["quoted_amount_etb"] == 2250000.0

    # 3. Issue Purchase Order
    po_payload = {
        "tender_id": tender_id,
        "vendor_name": "East Africa MedTech PLC",
        "total_amount_etb": 2250000.0,
        "issued_date": str(date.today()),
        "delivery_deadline": str(date.today() + timedelta(days=30)),
    }
    po_res = await client.post("/api/v1/procurement/purchase-orders", json=po_payload, headers=doctor_auth_headers)
    assert po_res.status_code == 201
    assert po_res.json()["po_number"].startswith("PO-")


@pytest.mark.asyncio
async def test_irb_protocol_and_academic_procedure_logbook(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test IRB ethical review submission & resident procedure logbook sign-off."""
    # 1. Submit IRB Protocol
    irb_payload = {
        "protocol_number": "IRB-MKH-2026-03",
        "study_title": "Efficacy of Community Malaria Interventions in Illubabor Zone",
        "principal_investigator_name": "Dr. Senait Fikre",
        "pi_email": "senait.fikre@mettukarl.et",
        "department": "Public Health & Epidemiology",
        "sample_size_target": 450,
    }
    irb_res = await client.post("/api/v1/academic/irb-protocols", json=irb_payload, headers=doctor_auth_headers)
    assert irb_res.status_code == 201
    irb_id = irb_res.json()["id"]

    # Approve Protocol
    appr_res = await client.post(f"/api/v1/academic/irb-protocols/{irb_id}/approve", headers=doctor_auth_headers)
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "approved"

    # 2. Log Resident Clinical Procedure
    log_payload = {
        "procedure_name": "Emergency Appendectomy",
        "role": "primary_operator",
        "performed_date": str(date.today()),
        "clinical_notes": "Uncomplicated McBurney incision, appendix successfully excised.",
    }
    log_res = await client.post("/api/v1/academic/logbooks", json=log_payload, headers=doctor_auth_headers)
    assert log_res.status_code == 201
    log_id = log_res.json()["id"]
    assert log_res.json()["supervisor_verified"] is False

    # 3. Supervisor Attending Physician Verification
    sign_res = await client.post(f"/api/v1/academic/logbooks/{log_id}/verify", headers=doctor_auth_headers)
    assert sign_res.status_code == 200
    assert sign_res.json()["supervisor_verified"] is True
