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
    biometric_match_score: Optional[float] = 96.5
    liveness_detected: bool = True
    biometric_modality: str = "fingerprint"
    scanner_device_model: Optional[str] = "SecuGen Hamster Pro 20"


class BiometricVerificationRequest(BaseModel):
    fin_number: str = Field(..., min_length=10, max_length=32, description="Fayda FAN/FIN number")
    modality: str = Field(default="fingerprint", description="Modality: fingerprint, iris, face, demographic")
    biometric_template_base64: Optional[str] = Field(None, description="ISO 19794-2 minutiae or WSQ/BMP template")
    scanner_device_model: Optional[str] = Field("SecuGen Hamster Pro 20", description="USB biometric reader model")
    capture_quality_score: Optional[float] = Field(92.0, ge=0.0, le=100.0, description="Hardware scanner capture quality")
    consent_given: bool = Field(True, description="Citizen/Patient consent recorded")

