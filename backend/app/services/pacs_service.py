"""
PACS / RIS Radiology Imaging service.
Stores and references DICOM studies, series, and instances in MinIO S3 object storage.
"""
from datetime import datetime, timezone
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pacs import (
    DICOMInstance,
    DICOMSeries,
    DICOMStudy,
    ModalityType,
    RadiologyOrder,
    RadiologyStatus,
)
from app.services.storage_service import get_storage_service


async def create_radiology_order(
    db: AsyncSession,
    patient_id: int,
    doctor_id: int,
    modality: ModalityType,
    body_part: str,
    clinical_indication: str,
) -> RadiologyOrder:
    """Create a new diagnostic imaging request."""
    code = f"RAD-{uuid.uuid4().hex[:8].upper()}"
    order = RadiologyOrder(
        order_code=code,
        patient_id=patient_id,
        ordering_doctor_id=doctor_id,
        modality=modality,
        body_part=body_part,
        clinical_indication=clinical_indication,
        status=RadiologyStatus.ORDERED,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


async def ingest_dicom_study(
    db: AsyncSession,
    patient_id: int,
    modality: ModalityType,
    study_description: str,
    study_datetime: datetime,
    radiology_order_id: Optional[int] = None,
) -> DICOMStudy:
    """Register DICOM study instance header."""
    study_uid = f"1.2.826.0.1.3680043.9.7129.{uuid.uuid4().int % 100000000000}"

    study = DICOMStudy(
        study_instance_uid=study_uid,
        radiology_order_id=radiology_order_id,
        patient_id=patient_id,
        modality=modality,
        study_description=study_description,
        study_datetime=study_datetime,
    )
    db.add(study)

    # If linked to a radiology order, mark order as image acquired
    if radiology_order_id:
        ord_stmt = select(RadiologyOrder).where(RadiologyOrder.id == radiology_order_id)
        ord_res = await db.execute(ord_stmt)
        order = ord_res.scalar_one_or_none()
        if order:
            order.status = RadiologyStatus.IMAGE_ACQUIRED

    await db.commit()
    await db.refresh(study)
    return study


def get_dicom_viewer_presigned_url(storage_object_key: str) -> str:
    """Generate secure temporary URL for the web DICOM image viewer."""
    storage = get_storage_service()
    return storage.get_presigned_download_url(storage_object_key, expires_minutes=120)
