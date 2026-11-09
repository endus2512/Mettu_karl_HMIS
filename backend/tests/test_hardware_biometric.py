"""
Tests for Biometric Fingerprint Readers (Fayda NID), Clinical PKI Digital Signatures
(Electronic Signature Proclamation 1072/2018), and HL7 v2.x MLLP Automated Lab Analyzers.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.hl7_mllp_service import generate_sample_sysmex_hl7, wrap_mllp_frame


@pytest.mark.asyncio
async def test_fayda_biometric_fingerprint_verification(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
):
    """Test physical USB biometric fingerprint verification against Fayda NID."""
    payload = {
        "fin_number": "FAN-9901-2384-5120",
        "modality": "fingerprint",
        "biometric_template_base64": "Rk1SACAyMAAAAABYAAEA...",
        "scanner_device_model": "SecuGen Hamster Pro 20",
        "capture_quality_score": 96.0,
        "consent_given": True,
    }

    res = await client.post("/api/v1/fayda/verify-biometric", json=payload, headers=doctor_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["verified"] is True
    assert data["fin_number"] == "FAN-9901-2384-5120"
    assert data["biometric_match_score"] >= 90.0
    assert data["liveness_detected"] is True
    assert data["scanner_device_model"] == "SecuGen Hamster Pro 20"
    assert data["biometric_modality"] == "fingerprint"
    assert data["full_name_en"] != ""


@pytest.mark.asyncio
async def test_clinical_digital_signature_and_tamper_detection(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """
    Test PKI Digital Signature sealing and tamper-evident detection.
    Altering any prescription payload item after signing must be caught.
    """
    prescription_doc = {
        "patient_mrn": "MKH-2026-000101",
        "patient_name": "Gudeta Hailu",
        "medications": [
            {"drug": "Amoxicillin", "dosage": "500mg", "frequency": "TID", "duration_days": 7},
            {"drug": "Paracetamol", "dosage": "1000mg", "frequency": "PRN", "duration_days": 3},
        ],
        "diagnosis": "Acute Bacterial Pharyngitis",
        "prescribed_date": "2026-11-09",
    }

    # 1. Sign Document
    sign_payload = {
        "document_type": "prescription",
        "document_id": "RX-2026-9021",
        "clinician_license_number": "ETH-MD-9921",
        "document_payload": prescription_doc,
    }

    sign_res = await client.post("/api/v1/signatures/sign", json=sign_payload, headers=doctor_auth_headers)
    assert sign_res.status_code == 201
    sig_data = sign_res.json()
    assert "MKH-SEAL-" in sig_data["verification_seal"]
    assert sig_data["document_payload_hash"] != ""
    assert sig_data["algorithm"] == "HMAC-SHA256-PKI"
    seal = sig_data["verification_seal"]

    # 2. Verify Original Untouched Document (Must Pass)
    verify_payload_valid = {
        "document_type": "prescription",
        "document_id": "RX-2026-9021",
        "verification_seal": seal,
        "document_payload": prescription_doc,
    }
    v_res = await client.post("/api/v1/signatures/verify", json=verify_payload_valid, headers=doctor_auth_headers)
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["is_authentic"] is True
    assert v_data["tamper_detected"] is False

    # 3. Verify Tampered Document (e.g. Alter Dosage to 1000mg) - MUST FAIL INTEGRITY
    tampered_doc = dict(prescription_doc)
    tampered_doc["medications"] = [
        {"drug": "Amoxicillin", "dosage": "1000mg", "frequency": "TID", "duration_days": 7},  # Tampered dosage!
        {"drug": "Paracetamol", "dosage": "1000mg", "frequency": "PRN", "duration_days": 3},
    ]

    verify_payload_tampered = {
        "document_type": "prescription",
        "document_id": "RX-2026-9021",
        "verification_seal": seal,
        "document_payload": tampered_doc,
    }
    t_res = await client.post("/api/v1/signatures/verify", json=verify_payload_tampered, headers=doctor_auth_headers)
    assert t_res.status_code == 200
    t_data = t_res.json()
    assert t_data["is_authentic"] is False
    assert t_data["tamper_detected"] is True
    assert "tampering detected" in t_data["verification_message"].lower()


@pytest.mark.asyncio
async def test_hl7_v2_mllp_lab_analyzer_ingestion(
    client: AsyncClient,
    technician_auth_headers: dict[str, str],
):
    """
    Test Sysmex XN-550 hematology analyzer HL7 v2.5 ORU^R01 packet ingestion and ACK return.
    """
    raw_hl7 = generate_sample_sysmex_hl7(mrn="MKH-2026-000101", patient_name="Gudeta^Hailu")

    ingest_payload = {
        "raw_hl7_message": raw_hl7,
        "analyzer_model": "Sysmex XN-550 Hematology",
        "instrument_serial": "SYS-XN550-METTU-01",
    }

    res = await client.post("/api/v1/hl7/ingest", json=ingest_payload, headers=technician_auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "success"
    assert data["sending_analyzer"] == "SYSMEX_XN550"
    assert data["patient_mrn"] == "MKH-2026-000101"
    assert data["parameters_count"] == 6  # WBC, RBC, HGB, HCT, PLT, NEUT_PCT
    assert any(p["parameter_code"] == "HGB" for p in data["parameters"])
    assert "MSA|AA|" in data["ack_message"]  # Valid HL7 Acknowledgement


@pytest.mark.asyncio
async def test_hl7_analyzer_telemetry_list(
    client: AsyncClient,
    technician_auth_headers: dict[str, str],
):
    """Test listing connected laboratory instruments."""
    res = await client.get("/api/v1/hl7/analyzers", headers=technician_auth_headers)
    assert res.status_code == 200
    analyzers = res.json()
    assert len(analyzers) >= 4
    names = [a["instrument_name"] for a in analyzers]
    assert "Sysmex XN-550" in names
    assert "Mindray BS-430" in names
    assert "GeneXpert IV" in names
