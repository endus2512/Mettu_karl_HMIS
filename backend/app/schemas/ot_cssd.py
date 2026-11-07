"""
Pydantic schemas for Operation Theatre (OT) and CSSD Sterilization.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.ot_cssd import SterilePackStatus, SterilizerType, SurgeryStatus


class OperatingRoomCreate(BaseModel):
    name: str
    room_code: str = "OT-1"
    specialty: str = "General Surgery"
    floor_location: str = "Block B - 2nd Floor"


class OperatingRoomResponse(OperatingRoomCreate):
    id: int
    is_active: bool
    active_booking_id: Optional[int] = None
    active_procedure_name: Optional[str] = None
    active_patient_name: Optional[str] = None
    active_surgeon_name: Optional[str] = None
    current_status: str = "available"

    model_config = {"from_attributes": True}


class SurgicalBookingCreate(BaseModel):
    patient_id: int
    room_id: int
    procedure_name: str = Field(..., min_length=3, max_length=255)
    lead_surgeon_id: int
    anesthesiologist_id: Optional[int] = None
    scrub_nurse_id: Optional[int] = None
    scheduled_start: datetime
    scheduled_end: datetime


class SurgicalBookingResponse(BaseModel):
    id: int
    booking_code: str
    patient_id: int
    patient_name: str
    patient_mrn: str
    patient_gender: str
    patient_age: int
    room_id: int
    room_name: str
    room_code: str
    procedure_name: str
    lead_surgeon_id: int
    lead_surgeon_name: str
    anesthesiologist_id: Optional[int] = None
    anesthesiologist_name: Optional[str] = None
    scrub_nurse_id: Optional[int] = None
    scrub_nurse_name: Optional[str] = None
    scheduled_start: datetime
    scheduled_end: datetime
    status: SurgeryStatus
    who_safety_checklist_verified: bool
    post_op_notes: Optional[str] = None
    blood_loss_ml: int = 0
    findings: Optional[str] = None
    implants_used: Optional[str] = None

    model_config = {"from_attributes": True}


class SurgicalStatusUpdate(BaseModel):
    status: SurgeryStatus


class WHOChecklistUpdate(BaseModel):
    verified: bool = True
    sign_in_checked: bool = True
    time_out_checked: bool = True
    sign_out_checked: bool = True
    notes: Optional[str] = None


class PostOpNotesUpdate(BaseModel):
    post_op_notes: str = Field(..., min_length=5)
    findings: Optional[str] = None
    blood_loss_ml: int = 0
    implants_used: Optional[str] = None


class CSSDBatchCreate(BaseModel):
    sterilizer_unit_name: str
    sterilizer_type: SterilizerType = SterilizerType.STEAM_AUTOCLAVE
    temperature_celsius: float = 134.0
    pressure_bar: float = 2.2
    cycle_duration_min: int = 45
    biological_indicator_passed: bool = True


class SterilePackCreate(BaseModel):
    batch_id: int
    pack_name: str
    expiry_date: datetime


class SterilePackResponse(BaseModel):
    id: int
    pack_code: str
    batch_id: int
    batch_code: Optional[str] = None
    pack_name: str
    expiry_date: datetime
    status: SterilePackStatus

    model_config = {"from_attributes": True}


class CSSDBatchResponse(CSSDBatchCreate):
    id: int
    batch_code: str
    sterilized_at: datetime
    operator_name: Optional[str] = None
    packs_count: int = 0

    model_config = {"from_attributes": True}


class CSSDBatchDetailResponse(CSSDBatchResponse):
    packs: List[SterilePackResponse] = []


class OTStatsResponse(BaseModel):
    total_rooms: int
    active_surgeries_count: int
    scheduled_today_count: int
    completed_today_count: int
    ready_sterile_packs_count: int
    active_autoclave_batches_count: int
    emergency_trauma_bookings_count: int


class SurgicalVoucherResponse(BaseModel):
    hospital_name_en: str
    hospital_name_om: str
    tin_number: str
    accreditation_level: str
    telephone: str
    location: str
    booking_code: str
    operating_room: str
    operating_room_code: str
    procedure_name: str
    patient_mrn: str
    patient_name: str
    patient_age: int
    patient_gender: str
    lead_surgeon: str
    anesthesiologist: str
    scrub_nurse: str
    scheduled_start: datetime
    scheduled_end: datetime
    status: str
    who_safety_checklist_verified: bool
    post_op_notes: Optional[str]
    operative_findings: Optional[str]
    blood_loss_ml: int
    implants_used: Optional[str]
    issued_timestamp: datetime
    verification_qr: str
