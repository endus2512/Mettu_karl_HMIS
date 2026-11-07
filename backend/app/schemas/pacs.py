"""
Pydantic schemas for PACS (DICOM) and RIS Radiology Management.
Supports doctor requisitions, study ingestion, radiologist narrative impressions,
and emergency critical imaging finding alerts.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.pacs import ModalityType, RadiologyStatus


class RadiologyOrderCreate(BaseModel):
    patient_id: int
    modality: ModalityType
    body_part: str = Field(..., max_length=100)
    clinical_indication: str = Field(..., max_length=255)
    priority: str = Field("routine", max_length=20)


class RadiologyOrderResponse(BaseModel):
    id: int
    order_code: str
    patient_id: int
    patient_mrn: str
    patient_name: str
    patient_gender: str
    patient_age: int
    ordering_doctor_name: str
    modality: ModalityType
    body_part: str
    clinical_indication: str
    priority: str
    status: RadiologyStatus
    ordered_at: datetime
    has_study: bool = False
    study_id: Optional[int] = None

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
    study_datetime: Optional[datetime] = None
    image_url: Optional[str] = None
    slice_count: int = 1
    window_width: int = 400
    window_level: int = 40


class RadiologyReportSubmit(BaseModel):
    radiologist_report: str
    clinical_impression: Optional[str] = None
    is_critical_finding: bool = False


class DICOMStudyResponse(BaseModel):
    id: int
    study_instance_uid: str
    radiology_order_id: Optional[int] = None
    patient_id: int
    patient_mrn: str
    patient_name: str
    patient_gender: str
    patient_age: int
    modality: ModalityType
    study_description: str
    study_datetime: datetime
    radiologist_report: Optional[str] = None
    clinical_impression: Optional[str] = None
    is_critical_finding: bool = False
    image_url: Optional[str] = None
    window_width: int = 400
    window_level: int = 40
    slice_count: int = 1
    reporting_doctor_name: Optional[str] = None
    verified_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PACSStatsResponse(BaseModel):
    total_studies_count: int
    pending_orders_count: int
    acquired_today_count: int
    critical_findings_count: int
    verified_reports_count: int
