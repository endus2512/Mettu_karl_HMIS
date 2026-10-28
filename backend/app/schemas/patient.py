"""
Pydantic schemas for Patient CRUD and clinical representation.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.patient import Gender


class PatientBase(BaseModel):
    """Base fields for patient records."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birth_date: date
    gender: Gender
    phone_number: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address_line: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field("Mettu", max_length=100)
    state_province: Optional[str] = Field("Oromia", max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)


class PatientCreate(PatientBase):
    """Schema for registering a new patient."""
    mrn: Optional[str] = Field(None, description="Optional custom MRN. Generated automatically if omitted.")


class PatientUpdate(BaseModel):
    """Schema for updating an existing patient."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    birth_date: Optional[date] = None
    gender: Optional[Gender] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    is_active: Optional[bool] = None


class PatientResponse(PatientBase):
    """Full patient detail response."""
    id: int
    mrn: str
    fhir_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
