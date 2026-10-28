"""
Pydantic schemas for Appointments, Telemedicine, and Patient Portal bookings.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.appointment import AppointmentStatus, AppointmentType


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    appointment_type: AppointmentType = AppointmentType.IN_PERSON
    scheduled_time: datetime
    reason: str
    clinical_department: str = "General OPD"


class AppointmentResponse(AppointmentCreate):
    id: int
    status: AppointmentStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class TelemedSessionCreate(BaseModel):
    appointment_id: Optional[int] = None
    patient_id: int


class TelemedSessionResponse(BaseModel):
    id: int
    room_id: str
    patient_id: int
    doctor_id: int
    is_active: bool
    started_at: datetime
    webrtc_room_url: str

    model_config = {"from_attributes": True}
