"""
Tests for Infection Control (HAI), EPHI Outbreak Surveillance (PHEM), and EHSTG Clinical Audits.
"""
from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Gender, Patient


@pytest.mark.asyncio
async def test_infection_control_and_phem_surveillance(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test hospital-acquired infection surveillance and EPHI outbreak reporting."""
    patient = Patient(
        mrn="MKH-INF-001",
        first_name="Tolessa",
        last_name="Bekele",
        birth_date=date(1990, 8, 15),
        gender=Gender.MALE,
        phone_number="+251911887766",
    )
    db_session.add(patient)
    await db_session.commit()
    await db_session.refresh(patient)

    # 1. Log Hospital-Acquired Infection (Surgical Site Infection)
    hai_payload = {
        "patient_id": patient.id,
        "hai_type": "surgical_site_infection",
        "ward": "Main Surgical Ward",
        "detected_date": str(date.today()),
        "pathogen_isolated": "Staphylococcus aureus (MRSA)",
        "antibiotic_sensitivity": "Sensitive to Vancomycin, Linezolid; Resistant to Oxacillin",
        "is_isolated": True,
        "investigating_nurse": "Nurse Chaltu Abera",
    }
    hai_res = await client.post("/api/v1/infection-control/hai-logs", json=hai_payload, headers=doctor_auth_headers)
    assert hai_res.status_code == 201
    assert hai_res.json()["is_isolated"] is True

    # 2. Submit PHEM Outbreak Notification (Suspected Cholera)
    phem_payload = {
        "disease_category": "cholera",
        "patient_id": patient.id,
        "kebele_origin": "Kebele 02, Sor Valley",
        "woreda_origin": "Mettu Woreda",
        "sample_sent_to_ephi": True,
        "ephi_lab_result": "Pending stool culture confirmation",
        "outcome": "Admitted to Cholera Treatment Center (CTC)",
    }
    phem_res = await client.post("/api/v1/infection-control/phem-reports", json=phem_payload, headers=doctor_auth_headers)
    assert phem_res.status_code == 201
    assert phem_res.json()["report_code"].startswith("PHEM-MKH-")


@pytest.mark.asyncio
async def test_clinical_audit_and_capa_workflow(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test EHSTG quality audit scoring and Corrective Action Plan resolution."""
    # 1. Log EHSTG Audit (Surgical Safety Checklist)
    audit_payload = {
        "audit_code": "AUD-EHSTG-2026-OT",
        "chapter": "surgical_safety_checklist",
        "department": "Main Operation Theatre",
        "audit_date": str(date.today()),
        "auditor_name": "Dr. Chala Gemechu (Quality Committee)",
        "compliance_score_percent": 74.0,  # Below 80%, triggers CAPA_PENDING
        "findings_summary": "Sign-out phase of WHO checklist missed in 6 of 25 observed major surgeries.",
    }
    a_res = await client.post("/api/v1/clinical-audit/audits", json=audit_payload, headers=doctor_auth_headers)
    assert a_res.status_code == 201
    audit_data = a_res.json()
    assert audit_data["status"] == "capa_pending"
    audit_id = audit_data["id"]

    # 2. Assign Corrective Action Plan (CAPA)
    capa_payload = {
        "audit_id": audit_id,
        "issue_description": "Scrub nurses and circulating teams not performing verbal count sign-out prior to closing peritoneum",
        "corrective_action": "Mandate circulating nurse verbal read-back and integrate electronic timer checklist into OT tablet",
        "assigned_to": "OT Head Nurse Almaz",
        "deadline_date": str(date.today()),
    }
    capa_res = await client.post("/api/v1/clinical-audit/capa", json=capa_payload, headers=doctor_auth_headers)
    assert capa_res.status_code == 201
    capa_id = capa_res.json()["id"]
    assert capa_res.json()["is_resolved"] is False

    # 3. Resolve CAPA
    res_capa = await client.post(f"/api/v1/clinical-audit/capa/{capa_id}/resolve", headers=doctor_auth_headers)
    assert res_capa.status_code == 200
    assert res_capa.json()["is_resolved"] is True
