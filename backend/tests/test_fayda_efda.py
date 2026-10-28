"""
Tests for National Digital ID (Fayda / FIN) and EFDA Pharmacovigilance.
"""
from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Gender, Patient


@pytest.mark.asyncio
async def test_fayda_verification_and_patient_linkage(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test eKYC query against Fayda National ID and linking FIN to patient."""
    # 1. Create Patient in db
    patient = Patient(
        mrn="MKH-FAYDA-001",
        first_name="Gudeta",
        last_name="Hailu",
        birth_date=date(1985, 4, 12),
        gender=Gender.MALE,
        phone_number="+251911002233",
    )
    db_session.add(patient)
    await db_session.commit()
    await db_session.refresh(patient)

    # 2. Verify Fayda ID
    verify_payload = {
        "fin_number": "FAN-9901-2384-5120",
        "consent_given": True,
    }
    v_res = await client.post("/api/v1/fayda/verify", json=verify_payload, headers=doctor_auth_headers)
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["verified"] is True
    assert v_data["fin_number"] == "FAN-9901-2384-5120"
    assert v_data["full_name_en"] != ""

    # 3. Link Fayda to Patient
    link_payload = {
        "patient_id": patient.id,
        "fin_number": "FAN-9901-2384-5120",
        "full_name_en": v_data["full_name_en"],
        "full_name_am": v_data["full_name_am"],
        "date_of_birth": v_data["date_of_birth"],
        "gender": v_data["gender"],
        "phone_number": v_data["phone_number"],
        "photo_url": v_data["photo_url"],
    }
    link_res = await client.post("/api/v1/fayda/link", json=link_payload, headers=doctor_auth_headers)
    assert link_res.status_code == 201
    assert link_res.json()["verification_status"] == "verified"

    # 4. Query Linked Fayda by Patient ID
    get_res = await client.get(f"/api/v1/fayda/patient/{patient.id}", headers=doctor_auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["fin_number"] == "FAN-9901-2384-5120"


@pytest.mark.asyncio
async def test_efda_adr_yellow_form_and_recalls(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test Adverse Drug Reaction reporting to EFDA and substandard drug recall alert."""
    # 1. Create Patient
    patient = Patient(
        mrn="MKH-EFDA-002",
        first_name="Ayantu",
        last_name="Mamo",
        birth_date=date(1994, 9, 23),
        gender=Gender.FEMALE,
        phone_number="+251922334455",
    )
    db_session.add(patient)
    await db_session.commit()
    await db_session.refresh(patient)

    # 2. Submit ADR Yellow Form
    adr_payload = {
        "patient_id": patient.id,
        "suspected_drug_name": "Ceftriaxone 1g Injection",
        "batch_number": "BAT-CEF-9921",
        "manufacturer": "Cadila Pharmaceuticals Ethiopia",
        "reaction_description": "Severe anaphylactoid reaction with bronchospasm and generalized urticaria within 10 min of infusion",
        "onset_date": str(date.today()),
        "severity": "severe",
        "dechallenge_outcome": "Reaction resolved with IV epinephrine and hydrocortisone",
        "rechallenge_outcome": "Not rechallenged",
        "reporter_name": "Dr. Bekele Tadesse",
        "reporter_role": "Attending Physician",
    }
    adr_res = await client.post("/api/v1/efda/adr-reports", json=adr_payload, headers=doctor_auth_headers)
    assert adr_res.status_code == 201
    adr_data = adr_res.json()
    assert adr_data["report_number"].startswith("ADR-MKH-")
    assert adr_data["status"] == "submitted"

    # 3. Broadcast Drug Recall
    recall_payload = {
        "recall_number": "RCL-EFDA-2026-11",
        "drug_name": "Metronidazole 500mg/100ml Infusion",
        "affected_batches": "BAT-MTZ-8801, BAT-MTZ-8802",
        "manufacturer": "Sino-Ethiopian Med PLC",
        "reason_for_recall": "Visible glass particulate matter detected during quality assurance sampling",
        "is_quarantine_enforced": True,
        "issued_date": str(date.today()),
    }
    rcl_res = await client.post("/api/v1/efda/recalls", json=recall_payload, headers=doctor_auth_headers)
    assert rcl_res.status_code == 201
    assert rcl_res.json()["is_quarantine_enforced"] is True
