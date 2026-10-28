"""
Pydantic schemas for PACS (DICOM) and RIS Radiology Management.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models.pacs import ModalityType, RadiologyStatus


class RadiologyOrderCreate(BaseModel):
    patient_id: int
    modality: ModalityType
    body_part: str
    clinical_indication: str


class RadiologyOrderResponse(RadiologyOrderCreate):
    id: int
    order_code: str
    ordering_doctor_id: int
    status: RadiologyStatus
    ordered_at: datetime

    model_config = {"from_attributes": True}


class DICOMInstanceResponse(BaseModel):
    id: int
    sop_instance_uid: str
    instance_number: int
    storage_object_key: str
    file_size_bytes: int
    viewer_url: Optional[str] = None

    model_config = {"from_attributes": True}


class DICOMStudyCreate(BaseModel):
    radiology_order_id: Optional[int] = None
    patient_id: int
    modality: ModalityType
    study_description: str
    study_datetime: datetime


class DICOMStudyResponse(DICOMStudyCreate):
    id: int
    study_instance_uid: str
    radiologist_report: Optional[str] = None
    verified_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
