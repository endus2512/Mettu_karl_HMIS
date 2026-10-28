"""
Pydantic schemas for Infection Control (HAI) and EPHI Outbreak Surveillance (PHEM).
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.infection_control import HAIType, PHEMDiseaseCategory


class HAILogCreate(BaseModel):
    patient_id: int
    hai_type: HAIType
    ward: str
    detected_date: date
    pathogen_isolated: Optional[str] = None
    antibiotic_sensitivity: Optional[str] = None
    is_isolated: bool = False
    investigating_nurse: str


class HAILogResponse(HAILogCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PHEMReportCreate(BaseModel):
    disease_category: PHEMDiseaseCategory
    patient_id: int
    kebele_origin: str
    woreda_origin: str
    sample_sent_to_ephi: bool = True
    ephi_lab_result: Optional[str] = None
    outcome: str = "Under Treatment"


class PHEMReportResponse(PHEMReportCreate):
    id: int
    report_code: str
    reported_to_ephi_at: datetime

    model_config = {"from_attributes": True}
