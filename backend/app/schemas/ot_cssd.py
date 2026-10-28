"""
Pydantic schemas for Operation Theatre (OT) and CSSD Sterilization.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.ot_cssd import SterilePackStatus, SterilizerType, SurgeryStatus


class OperatingRoomCreate(BaseModel):
    name: str
    specialty: str = "General Surgery"


class OperatingRoomResponse(OperatingRoomCreate):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


class SurgicalBookingCreate(BaseModel):
    patient_id: int
    room_id: int
    procedure_name: str
    lead_surgeon_id: int
    anesthesiologist_id: Optional[int] = None
    scrub_nurse_id: Optional[int] = None
    scheduled_start: datetime
    scheduled_end: datetime


class SurgicalBookingResponse(SurgicalBookingCreate):
    id: int
    booking_code: str
    status: SurgeryStatus
    who_safety_checklist_verified: bool
    post_op_notes: Optional[str] = None

    model_config = {"from_attributes": True}


class CSSDBatchCreate(BaseModel):
    sterilizer_unit_name: str
    sterilizer_type: SterilizerType = SterilizerType.STEAM_AUTOCLAVE
    temperature_celsius: float = 134.0
    pressure_bar: float = 2.2
    cycle_duration_min: int = 45
    biological_indicator_passed: bool = True


class CSSDBatchResponse(CSSDBatchCreate):
    id: int
    batch_code: str
    sterilized_at: datetime

    model_config = {"from_attributes": True}


class SterilePackCreate(BaseModel):
    batch_id: int
    pack_name: str
    expiry_date: datetime


class SterilePackResponse(SterilePackCreate):
    id: int
    pack_code: str
    status: SterilePackStatus

    model_config = {"from_attributes": True}
