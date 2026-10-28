"""
Tests for Clinical Decision Support System (CDSS) DDI and allergy checks.
"""
from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cdss import DrugInteraction, PatientAllergy, SeverityLevel
from app.models.patient import Gender, Patient


@pytest.mark.asyncio
async def test_cdss_drug_interaction_detection(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Test flagging of dangerous drug interactions."""
    p = Patient(
        mrn="MKH-CDSS-01",
        fhir_id="fhir-cdss-01",
        first_name="Bekele",
        last_name="Aragaw",
        birth_date=date(1980, 2, 2),
        gender=Gender.MALE,
    )
    db_session.add(p)

    # Add interaction rule: Warfarin + Aspirin = CRITICAL bleeding risk
    rule = DrugInteraction(
        drug_a_name="warfarin",
        drug_b_name="aspirin",
        severity=SeverityLevel.CRITICAL,
        clinical_effect="Significantly increased risk of severe gastrointestinal bleeding",
        recommendation="Avoid combination. Use alternative analgesic.",
    )
    db_session.add(rule)
    await db_session.commit()

    check_payload = {
        "patient_id": p.id,
        "drug_names": ["Warfarin 5mg", "Aspirin 81mg"],
    }

    res = await client.post("/api/v1/cdss/check-prescription", json=check_payload, headers=doctor_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["has_critical_alerts"] is True
    assert len(data["interactions"]) == 1
    assert "bleeding" in data["interactions"][0]["clinical_effect"].lower()


@pytest.mark.asyncio
async def test_cdss_patient_allergy_detection(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Test flagging of prescribed drug against known patient allergies."""
    p = Patient(
        mrn="MKH-CDSS-02",
        fhir_id="fhir-cdss-02",
        first_name="Lensa",
        last_name="Duresa",
        birth_date=date(1992, 5, 15),
        gender=Gender.FEMALE,
    )
    db_session.add(p)
    await db_session.commit()

    # Document allergy to Penicillin
    allergy = PatientAllergy(
        patient_id=p.id,
        substance="Penicillin",
        reaction="Severe Anaphylactic Shock",
        severity=SeverityLevel.CRITICAL,
    )
    db_session.add(allergy)
    await db_session.commit()

    check_payload = {
        "patient_id": p.id,
        "drug_names": ["Amoxicillin (Penicillin-class)", "Ibuprofen"],
    }

    res = await client.post("/api/v1/cdss/check-prescription", json=check_payload, headers=doctor_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["has_critical_alerts"] is True
    assert len(data["allergies"]) == 1
    assert "penicillin" in data["allergies"][0]["allergen_substance"].lower()
