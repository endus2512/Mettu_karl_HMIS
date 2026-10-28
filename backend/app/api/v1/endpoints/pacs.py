"""
PACS / RIS Radiology Imaging endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.pacs import (
    DICOMInstance,
    DICOMSeries,
    DICOMStudy,
    RadiologyOrder,
)
from app.models.user import User
from app.schemas.pacs import (
    DICOMInstanceResponse,
    DICOMStudyCreate,
    DICOMStudyResponse,
    RadiologyOrderCreate,
    RadiologyOrderResponse,
)
from app.services.pacs_service import (
    create_radiology_order,
    get_dicom_viewer_presigned_url,
    ingest_dicom_study,
)

router = APIRouter()


@router.post("/orders", response_model=RadiologyOrderResponse, status_code=status.HTTP_201_CREATED, summary="Order Diagnostic Radiology")
async def place_radiology_order(
    order_in: RadiologyOrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> RadiologyOrder:
    """Doctor requests an X-Ray, CT, MRI, or Ultrasound study."""
    return await create_radiology_order(
        db,
        patient_id=order_in.patient_id,
        doctor_id=current_user.id,
        modality=order_in.modality,
        body_part=order_in.body_part,
        clinical_indication=order_in.clinical_indication,
    )


@router.get("/studies", response_model=List[DICOMStudyResponse], summary="List DICOM Studies")
async def list_dicom_studies(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    patient_id: Optional[int] = None,
) -> List[DICOMStudy]:
    """Retrieve indexed radiology imaging studies."""
    query = select(DICOMStudy)
    if patient_id:
        query = query.where(DICOMStudy.patient_id == patient_id)
    res = await db.execute(query.order_by(DICOMStudy.study_datetime.desc()))
    return list(res.scalars().all())


@router.post("/studies", response_model=DICOMStudyResponse, status_code=status.HTTP_201_CREATED, summary="Ingest DICOM Study")
async def create_study(
    study_in: DICOMStudyCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> DICOMStudy:
    """Ingest metadata from radiology modalities into PACS database."""
    return await ingest_dicom_study(
        db,
        patient_id=study_in.patient_id,
        modality=study_in.modality,
        study_description=study_in.study_description,
        study_datetime=study_in.study_datetime,
        radiology_order_id=study_in.radiology_order_id,
    )


@router.get("/studies/{study_uid}/instances", response_model=List[DICOMInstanceResponse], summary="Get DICOM Slices with Viewer URLs")
async def get_study_instances(
    study_uid: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[DICOMInstanceResponse]:
    """Fetch all DICOM image instances with presigned URLs for web viewer streaming."""
    stmt = (
        select(DICOMInstance)
        .join(DICOMSeries, DICOMSeries.id == DICOMInstance.series_id)
        .join(DICOMStudy, DICOMStudy.id == DICOMSeries.study_id)
        .where(DICOMStudy.study_instance_uid == study_uid)
    )
    res = await db.execute(stmt)
    instances = list(res.scalars().all())

    results = []
    for inst in instances:
        url = get_dicom_viewer_presigned_url(inst.storage_object_key)
        results.append(
            DICOMInstanceResponse(
                id=inst.id,
                sop_instance_uid=inst.sop_instance_uid,
                instance_number=inst.instance_number,
                storage_object_key=inst.storage_object_key,
                file_size_bytes=inst.file_size_bytes,
                viewer_url=url,
            )
        )
    return results
