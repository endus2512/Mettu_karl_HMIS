"""
Pydantic schemas for National Digital ID (Fayda / Ethiopian FIN) integration.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.fayda import FaydaVerificationStatus


class FaydaLookupRequest(BaseModel):
    fin_number: str = Field(..., min_length=10, max_length=32, description="Fayda Identification Number")
    consent_given: bool = Field(True, description="Patient consent to fetch national identity attributes")


class FaydaRecordCreate(BaseModel):
    patient_id: int
    fin_number: str = Field(..., min_length=10, max_length=32)
    full_name_am: Optional[str] = None
    full_name_en: str
    date_of_birth: date
    gender: str
    phone_number: str
    photo_url: Optional[str] = None


class FaydaRecordResponse(FaydaRecordCreate):
    id: int
    verification_status: FaydaVerificationStatus
    verified_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class FaydaVerificationResponse(BaseModel):
    verified: bool
    fin_number: str
    full_name_en: str
    full_name_am: Optional[str] = None
    date_of_birth: date
    gender: str
    phone_number: str
    photo_url: Optional[str] = None
    verification_timestamp: datetime
