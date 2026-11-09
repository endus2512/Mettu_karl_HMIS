"""
End-to-End (E2E) Clinical User Journey & Continuous Quality Gate Tests.

Validates the full enterprise hospital workflow across departments:
1. Journey A: Outpatient Clinical Care (Reception -> Fayda -> Queue -> Doctor -> CDSS -> Lab HL7 -> Digital Signature -> Billing Telebirr)
2. Journey B: Emergency & Disaster Triage (Ambulance Hotline -> MCI START Protocol -> Event Bus Code Blue -> Bedside IoMT)
3. Journey C: Edge Sync Resilience (Outreach Post Offline Buffer -> Central Ingestion & Deduplication)
"""
from datetime import date, datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import CBHIPolicy
from app.models.cdss import DrugInteraction, SeverityLevel
from app.models.laboratory import LabCategory, LabTestCatalog, SpecimenType
from app.models.patient import Gender, Patient
from app.models.pharmacy import DosageForm, Drug, DrugBatch
from app.models.queue import QueueDepartment
from app.services.hl7_mllp_service import generate_sample_sysmex_hl7, wrap_mllp_frame


@pytest.mark.asyncio
async def test_e2e_outpatient_clinical_journey(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    technician_auth_headers: dict[str, str],
    billing_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """
    End-to-end multi-role outpatient clinical journey:
    1. Reception creates patient record via FHIR R4 API.
    2. Reception links Fayda National Digital ID via biometric verification.
    3. Reception issues queue token; clinician calls patient to desk.
    4. Doctor checks CDSS for drug safety and interaction risks.
    5. Doctor orders CBC laboratory diagnostic test.
    6. Automated hematology analyzer pushes HL7 v2.x result packet via MLLP.
    7. Doctor digitally signs prescription with PKI cryptographic seal.
    8. Cashier generates invoice and customer completes instant Telebirr USSD payment.
    """
    # -------------------------------------------------------------------------
    # STEP 1: Reception Desk creates Master Patient Record (FHIR R4)
    # -------------------------------------------------------------------------
    pat_payload = {
        "first_name": "Kenenisa",
        "last_name": "Tadesse",
        "birth_date": "1992-05-14",
        "gender": "male",
        "phone_number": "+251911334455",
        "email": "kenenisa.tadesse@example.com",
        "address_line": "Kebele 04",
        "city": "Mettu",
        "state_province": "Oromia",
    }
    create_pat_res = await client.post("/api/v1/fhir/r4/Patient", json=pat_payload, headers=doctor_auth_headers)
    assert create_pat_res.status_code == 201
    created_pat_data = create_pat_res.json()
    patient_fhir_id = created_pat_data["id"]
    patient_mrn = created_pat_data["identifier"][0]["value"]
    assert patient_mrn.startswith("MKH-")

    # Fetch SQL patient ID from DB for relational endpoints
    pat_sql_res = await client.get(f"/api/v1/fhir/r4/Patient/{patient_fhir_id}", headers=doctor_auth_headers)
    assert pat_sql_res.status_code == 200

    # -------------------------------------------------------------------------
    # STEP 2: Fayda National Digital ID (FIN) Biometric Verification
    # -------------------------------------------------------------------------
    fayda_payload = {
        "fin_number": "FAN-9901-2384-5120",
        "modality": "fingerprint",
        "biometric_template_base64": "Rk1SACAyMAAAAABYAAEA...",
        "scanner_device_model": "SecuGen Hamster Pro 20",
        "capture_quality_score": 98.5,
        "consent_given": True,
    }
    fayda_res = await client.post("/api/v1/fayda/verify-biometric", json=fayda_payload, headers=doctor_auth_headers)
    assert fayda_res.status_code == 200
    assert fayda_res.json()["verified"] is True
    assert fayda_res.json()["fin_number"] == "FAN-9901-2384-5120"

    # -------------------------------------------------------------------------
    # STEP 3: Queue Management & Smart Token Call
    # -------------------------------------------------------------------------
    # Create OPD department queue in DB
    dept = QueueDepartment(
        name="Outpatient Consultation Desk 1",
        code="OPD_E2E",
        token_prefix="C",
        counter_name="Room 105",
        is_active=True,
    )
    db_session.add(dept)
    await db_session.commit()

    # Issue queue ticket for patient
    ticket_res = await client.post(
        "/api/v1/queue/tickets",
        json={"department_code": "OPD_E2E", "priority": "urgent"},
    )
    assert ticket_res.status_code == 201
    ticket_number = ticket_res.json()["ticket_number"]
    assert ticket_number.startswith("C-")

    # Doctor calls patient next
    call_res = await client.post(
        "/api/v1/queue/call-next",
        json={"department_code": "OPD_E2E", "room_counter": "Consultation Desk 1"},
        headers=doctor_auth_headers,
    )
    assert call_res.status_code == 200
    assert call_res.json()["ticket_number"] == ticket_number
    assert call_res.json()["status"] == "called"

    # -------------------------------------------------------------------------
    # STEP 4: Doctor Consultation & CDSS Drug-Drug Interaction Safety
    # -------------------------------------------------------------------------
    # Retrieve DB patient entity ID
    db_pat = (await db_session.execute(Patient.__table__.select().where(Patient.mrn == patient_mrn))).fetchone()
    patient_id = db_pat.id

    # Seed dangerous DDI rule (Warfarin + Aspirin)
    ddi_rule = DrugInteraction(
        drug_a_name="warfarin",
        drug_b_name="aspirin",
        severity=SeverityLevel.CRITICAL,
        clinical_effect="High risk of gastrointestinal hemorrhage",
        recommendation="Replace with alternative analgesic.",
    )
    db_session.add(ddi_rule)
    await db_session.commit()

    # Doctor screens candidate medications
    cdss_res = await client.post(
        "/api/v1/cdss/check-prescription",
        json={"patient_id": patient_id, "drug_names": ["Warfarin 5mg", "Aspirin 81mg"]},
        headers=doctor_auth_headers,
    )
    assert cdss_res.status_code == 200
    cdss_data = cdss_res.json()
    assert cdss_data["has_critical_alerts"] is True
    assert len(cdss_data["interactions"]) == 1

    # Safe prescription selected instead (Amoxicillin)
    cdss_safe_res = await client.post(
        "/api/v1/cdss/check-prescription",
        json={"patient_id": patient_id, "drug_names": ["Amoxicillin 500mg", "Paracetamol 500mg"]},
        headers=doctor_auth_headers,
    )
    assert cdss_safe_res.status_code == 200
    assert cdss_safe_res.json()["has_critical_alerts"] is False

    # -------------------------------------------------------------------------
    # STEP 5: Laboratory Diagnostic Ordering & Automated HL7 Analyzers
    # -------------------------------------------------------------------------
    # Create CBC catalog entry
    test_catalog = LabTestCatalog(
        test_code="CBC_FULL",
        test_name="Complete Blood Count Automated",
        name_om="Qorannoo Dhiigaa Guutuu",
        category=LabCategory.HEMATOLOGY,
        specimen_type=SpecimenType.WHOLE_BLOOD_EDTA,
        tube_color="Lavender (EDTA)",
        price_etb=150.0,
        turnaround_time_mins=30,
        parameters_json='[{"name": "WBC", "unit": "10^3/uL", "min": 4.5, "max": 11.0}]',
        is_active=True,
    )
    db_session.add(test_catalog)
    await db_session.commit()

    # Doctor places lab requisition
    order_payload = {
        "patient_id": patient_id,
        "priority": "urgent",
        "clinical_notes": "Suspected bacterial infection with fever",
        "test_catalog_ids": [test_catalog.id],
    }
    lab_order_res = await client.post("/api/v1/laboratory/orders", json=order_payload, headers=doctor_auth_headers)
    assert lab_order_res.status_code == 201
    lab_order_data = lab_order_res.json()
    assert lab_order_data["patient_mrn"] == patient_mrn

    # Automated Mindray/Sysmex analyzer pushes result via HL7 v2.x MLLP protocol
    raw_hl7 = generate_sample_sysmex_hl7(
        mrn=patient_mrn,
        patient_name="Tadesse^Kenenisa",
    )
    hl7_res = await client.post(
        "/api/v1/hl7/ingest",
        json={
            "raw_hl7_message": raw_hl7,
            "analyzer_model": "Sysmex XN-550 Hematology",
            "instrument_serial": "SYS-XN550-METTU-01",
        },
        headers=technician_auth_headers,
    )
    assert hl7_res.status_code == 201
    assert hl7_res.json()["status"] == "success"
    assert hl7_res.json()["sending_analyzer"] == "SYSMEX_XN550"
    assert hl7_res.json()["parameters_count"] == 6

    # -------------------------------------------------------------------------
    # STEP 6: PKI Digital Signature Sealing (Proclamation 1072/2018)
    # -------------------------------------------------------------------------
    prescription_doc = {
        "patient_mrn": patient_mrn,
        "patient_name": "Kenenisa Tadesse",
        "medications": [
            {"drug": "Amoxicillin", "dosage": "500mg", "frequency": "TID", "duration_days": 7},
            {"drug": "Paracetamol", "dosage": "500mg", "frequency": "PRN", "duration_days": 3},
        ],
        "diagnosis": "Acute Bronchitis (ICD-10: J20.9)",
        "prescribed_date": "2026-11-09",
    }
    sign_payload = {
        "document_type": "prescription",
        "document_id": "RX-2026-9021",
        "clinician_license_number": "ETH-MD-9921",
        "document_payload": prescription_doc,
    }
    sign_res = await client.post("/api/v1/signatures/sign", json=sign_payload, headers=doctor_auth_headers)
    assert sign_res.status_code == 201
    signature_data = sign_res.json()
    assert "MKH-SEAL-" in signature_data["verification_seal"]
    assert signature_data["algorithm"] == "HMAC-SHA256-PKI"
    assert signature_data["document_payload_hash"] != ""

    # -------------------------------------------------------------------------
    # STEP 7: Cashier Billing & Instant Telebirr USSD Payment
    # -------------------------------------------------------------------------
    invoice_payload = {
        "patient_id": patient_id,
        "items": [
            {"service_name": "Doctor OPD Consultation", "quantity": 1, "unit_price": 100.0},
            {"service_name": "CBC Complete Blood Count", "quantity": 1, "unit_price": 150.0},
            {"service_name": "Amoxicillin 500mg 21 Capsules", "quantity": 1, "unit_price": 75.0},
        ],
        "apply_cbhi": False,
    }
    invoice_res = await client.post("/api/v1/billing/invoices", json=invoice_payload, headers=billing_auth_headers)
    assert invoice_res.status_code == 201
    invoice_data = invoice_res.json()
    invoice_id = invoice_data["id"]
    assert invoice_data["total_amount"] == 325.0
    assert invoice_data["status"] == "pending"

    # Trigger Telebirr mobile payment checkout
    telebirr_pay_res = await client.post(
        "/api/v1/billing/telebirr/pay",
        json={"invoice_id": invoice_id, "phone_number": "+251911334455"},
        headers=billing_auth_headers,
    )
    assert telebirr_pay_res.status_code == 200
    telebirr_data = telebirr_pay_res.json()
    tx_ref = telebirr_data["transaction_reference"]
    assert tx_ref.startswith("TB-")
    assert telebirr_data["amount"] == 325.0

    # Simulate customer entering PIN on Telebirr mobile prompt
    confirm_res = await client.post(
        "/api/v1/billing/telebirr/confirm",
        json={"transaction_reference": tx_ref},
        headers=billing_auth_headers,
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "paid"
    assert confirm_res.json()["paid_amount"] == 325.0


@pytest.mark.asyncio
async def test_e2e_emergency_mci_journey(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """
    End-to-end Mass Casualty Incident (MCI) and emergency workflow:
    1. Incident declared on Bedele-Mettu corridor.
    2. START triage tags casualties (Red Immediate / Yellow Delayed).
    3. Hospital-wide Code Blue emergency broadcast via WebSocket event bus.
    4. IoMT bedside telemetry streaming verifies active telemetry reception.
    """
    # 1. Declare Disaster
    mci_payload = {
        "incident_code": "MCI-E2E-SOR-01",
        "incident_name": "Mini-bus Collision near Sor Falls Bridge",
        "incident_location": "Sor River Road, Mettu",
        "estimated_casualties": 18,
        "incident_commander": "Dr. Karl Mettu",
    }
    mci_res = await client.post("/api/v1/mci/incidents", json=mci_payload, headers=doctor_auth_headers)
    assert mci_res.status_code == 201
    incident_id = mci_res.json()["id"]

    # 2. Tag Red Critical Casualty (Respiratory rate 34 -> Red Immediate)
    tag_res = await client.post(
        "/api/v1/mci/tags",
        json={
            "incident_id": incident_id,
            "triage_category": "red_immediate",
            "respiratory_rate": 34,
            "has_radial_pulse": True,
            "can_follow_commands": False,
            "assigned_bay": "Emergency Resuscitation Bay 1",
            "disposition_notes": "Head trauma and airway compromise",
        },
        headers=doctor_auth_headers,
    )
    assert tag_res.status_code == 201
    assert tag_res.json()["triage_category"] == "red_immediate"
    assert tag_res.json()["tag_number"].startswith("MCI-RED-")

    # 3. Trigger Hospital-Wide Real-Time Emergency Broadcast (Code Blue Siren)
    broadcast_payload = {
        "code_name": "CODE_BLUE",
        "location": "Trauma Resuscitation Bay 1",
        "details": "Mass casualty arrival: Red tag unstable casualty requiring immediate surgical airway and blood transfusion.",
        "target_roles": ["doctor", "nurse", "technician"],
        "department": "Emergency",
    }
    broadcast_res = await client.post("/api/v1/events/notifications/broadcast", json=broadcast_payload, headers=doctor_auth_headers)
    assert broadcast_res.status_code == 201
    broadcast_data = broadcast_res.json()
    assert broadcast_data["severity"] == "emergency"
    assert broadcast_data["category"] == "code_blue"

    # 4. Ingest IoMT bedside vital signs telemetry
    device_payload = {
        "device_uid": "MON-TRAUMA-01",
        "name": "Mindray BeneVision N17 Resuscitation Monitor",
        "device_type": "bedside_monitor",
        "ward": "Emergency Trauma Resuscitation",
        "bed_number": "Bay 1",
        "current_patient_id": 1,
    }
    dev_res = await client.post("/api/v1/iomt/devices", json=device_payload, headers=doctor_auth_headers)
    assert dev_res.status_code == 201
    dev_id = dev_res.json()["id"]

    iomt_res = await client.post(
        "/api/v1/iomt/telemetry",
        json={
            "device_id": dev_id,
            "patient_id": 1,
            "heart_rate_bpm": 138,
            "spo2_percent": 88,
            "systolic_bp_mmhg": 85,
            "diastolic_bp_mmhg": 50,
            "temperature_celsius": 35.8,
        },
        headers=doctor_auth_headers,
    )
    assert iomt_res.status_code == 201


@pytest.mark.asyncio
async def test_e2e_offline_edge_sync_resilience_journey(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
):
    """
    End-to-end edge sync resilience journey:
    1. Peripheral health center (Hurumu clinic) buffers registration, observations & Rx offline.
    2. Syncs batch to central hospital database.
    3. Verifies deduplication, ID assignment, and resolution mapping.
    """
    # 1. Edge Sync Batch with newly registered offline patient
    offline_batch = {
        "station_id": "CLINIC-HURUMU-OUTREACH",
        "station_name": "Hurumu Community Health Post",
        "batch_timestamp": datetime.now(timezone.utc).isoformat(),
        "patients": [
            {
                "temp_id": "OFFLINE-PAT-E2E-77",
                "first_name": "Ayantu",
                "last_name": "Diriba",
                "birth_date": "1997-11-20",
                "gender": "female",
                "phone_number": "+251912998877",
                "kebele": "Hurumu 04",
                "woreda": "Hurumu",
                "created_offline_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "observations": [
            {
                "temp_id": "OFFLINE-OBS-E2E-01",
                "patient_mrn": "OFFLINE-PAT-E2E-77",
                "vital_type": "heart_rate",
                "value": "76",
                "unit": "bpm",
                "recorded_offline_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "prescriptions": [
            {
                "temp_id": "OFFLINE-RX-E2E-01",
                "patient_mrn": "OFFLINE-PAT-E2E-77",
                "medications": [
                    {"name": "Ferrous Sulfate 200mg", "dosage": "1 tab PO daily", "quantity": 30}
                ],
                "prescribed_offline_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }

    sync_res = await client.post("/api/v1/sync/edge-batch", json=offline_batch, headers=doctor_auth_headers)
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["patients_processed"] == 1
    assert sync_data["observations_processed"] == 1
    assert sync_data["prescriptions_processed"] == 1

    pat_resolution = next(r for r in sync_data["resolutions"] if r["temp_id"] == "OFFLINE-PAT-E2E-77")
    assert pat_resolution["status"] == "RESOLVED_INSERTED"
    assert pat_resolution["permanent_id"] > 0
