"""
Tests for PACS / RIS Radiology Orders and DICOM Ingestion.
"""
from datetime import date, datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pacs import ModalityType, RadiologyOrder, RadiologyStatus
from app.models.patient import Gender, Patient
from app.models.user import User


@pytest.mark.asyncio
async def test_radiology_order_and_dicom_ingestion(client: AsyncClient, doctor_auth_headers: dict[str, str], test_doctor_user: User, db_session: AsyncSession):
    """Test full cycle: ordering an X-Ray study and ingesting the acquired DICOM study."""
    p = Patient(
        mrn="MKH-XRAY-01",
        fhir_id="fhir-xray-01",
        first_name="Abera",
        last_name="Duresa",
        birth_date=date(1988, 4, 12),
        gender=Gender.MALE,
    )
    db_session.add(p)
    await db_session.commit()

    # 1. Place radiology order
    order_payload = {
        "patient_id": p.id,
        "modality": "CR",
        "body_part": "Chest (PA View)",
        "clinical_indication": "Suspected lobar pneumonia with persistent cough",
    }
    res_order = await client.post("/api/v1/pacs/orders", json=order_payload, headers=doctor_auth_headers)
    assert res_order.status_code == 201
    order_data = res_order.json()
    assert order_data["status"] == "ordered"
    order_id = order_data["id"]

    # 2. Ingest DICOM study from X-Ray modality
    study_payload = {
        "radiology_order_id": order_id,
        "patient_id": p.id,
        "modality": "CR",
        "study_description": "Chest PA View Digital Radiography",
        "study_datetime": datetime.now(timezone.utc).isoformat(),
    }
    res_study = await client.post("/api/v1/pacs/studies", json=study_payload, headers=doctor_auth_headers)
    assert res_study.status_code == 201
    study_data = res_study.json()
    assert "study_instance_uid" in study_data
