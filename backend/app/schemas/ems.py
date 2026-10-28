"""
Pydantic schemas for Ambulance Fleet and Emergency 907 Dispatch (EMS).
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.ems import DispatchStatus, TriageLevel


class AmbulanceCreate(BaseModel):
    plate_number: str
    vehicle_model: str = "Toyota Land Cruiser"
    is_als: bool = True
    driver_name: str
    driver_phone: str
    current_lat: Optional[float] = 8.3000
    current_lon: Optional[float] = 35.5833


class AmbulanceResponse(AmbulanceCreate):
    id: int
    is_available: bool
    last_gps_update: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EmergencyCallCreate(BaseModel):
    caller_name: str
    caller_phone: str
    location_address: str
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None
    triage_level: TriageLevel = TriageLevel.RED
    chief_complaint: str


class EmergencyCallResponse(EmergencyCallCreate):
    id: int
    incident_code: str
    status: DispatchStatus
    ambulance_id: Optional[int] = None
    received_at: datetime
    dispatched_at: Optional[datetime] = None
    arrived_hospital_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DispatchAmbulanceRequest(BaseModel):
    incident_id: int
    ambulance_id: int
