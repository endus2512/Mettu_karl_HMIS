"""
Pydantic schemas for Ambulance Fleet, 907 Emergency Hotline, and Pre-Hospital Dispatch (EMS).
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator

from app.models.ems import DispatchStatus, TriageLevel


class AmbulanceCreate(BaseModel):
    plate_number: str
    call_sign: Optional[str] = None
    vehicle_model: Optional[str] = "Toyota Land Cruiser HZJ78"
    vehicle_type: Optional[str] = "advanced_life_support"
    is_als: bool = True
    driver_name: Optional[str] = "EMS Standby Driver"
    driver_phone: Optional[str] = "+251911907907"
    assigned_crew: Optional[str] = "Paramedic & EMT Team"
    current_lat: Optional[float] = 8.3000
    current_lon: Optional[float] = 35.5833
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    fuel_level_percent: Optional[int] = 85
    oxygen_tank_bar: Optional[int] = 200

    @model_validator(mode="before")
    @classmethod
    def normalize_ambulance(cls, data: dict):
        if not isinstance(data, dict):
            return data
        if "call_sign" not in data and "plate_number" in data:
            data["call_sign"] = data.get("plate_number")
        if "current_latitude" in data and "current_lat" not in data:
            data["current_lat"] = data["current_latitude"]
        elif "current_lat" in data and "current_latitude" not in data:
            data["current_latitude"] = data["current_lat"]

        if "current_longitude" in data and "current_lon" not in data:
            data["current_lon"] = data["current_longitude"]
        elif "current_lon" in data and "current_longitude" not in data:
            data["current_longitude"] = data["current_lon"]

        if "vehicle_type" in data and "vehicle_model" not in data:
            data["vehicle_model"] = data["vehicle_type"]
        elif "vehicle_model" in data and "vehicle_type" not in data:
            data["vehicle_type"] = data["vehicle_model"]
        return data


class AmbulanceResponse(BaseModel):
    id: int
    call_sign: Optional[str] = None
    plate_number: str
    vehicle_model: str
    vehicle_type: Optional[str] = None
    is_als: bool
    driver_name: str
    driver_phone: str
    assigned_crew: Optional[str] = None
    is_available: bool
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    fuel_level_percent: Optional[int] = 85
    oxygen_tank_bar: Optional[int] = 200
    last_gps_update: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EmergencyCallCreate(BaseModel):
    caller_phone: str
    caller_name: Optional[str] = "Emergency 907 Hotline"
    location_address: Optional[str] = None
    incident_location: Optional[str] = None
    chief_complaint: Optional[str] = None
    emergency_description: Optional[str] = None
    triage_level: Optional[str] = "RED"
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None
    paramedic_notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_call(cls, data: dict):
        if not isinstance(data, dict):
            return data
        if "incident_location" in data and "location_address" not in data:
            data["location_address"] = data["incident_location"]
        elif "location_address" in data and "incident_location" not in data:
            data["incident_location"] = data["location_address"]

        if "emergency_description" in data and "chief_complaint" not in data:
            data["chief_complaint"] = data["emergency_description"]
        elif "chief_complaint" in data and "emergency_description" not in data:
            data["emergency_description"] = data["chief_complaint"]

        if "caller_name" not in data:
            data["caller_name"] = "Hotline 907 Caller"
        return data


class EmergencyCallResponse(BaseModel):
    id: int
    incident_code: str
    caller_name: str
    caller_phone: str
    location_address: str
    incident_location: Optional[str] = None
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None
    triage_level: str
    chief_complaint: str
    emergency_description: Optional[str] = None
    status: str
    dispatch_status: str
    ambulance_id: Optional[int] = None
    assigned_ambulance_id: Optional[int] = None
    assigned_ambulance_plate: Optional[str] = None
    assigned_ambulance_call_sign: Optional[str] = None
    paramedic_notes: Optional[str] = None
    vital_signs_summary: Optional[str] = None
    received_at: datetime
    dispatched_at: Optional[datetime] = None
    arrived_hospital_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DispatchAmbulanceRequest(BaseModel):
    incident_id: Optional[int] = None
    emergency_call_id: Optional[int] = None
    ambulance_id: int

    @model_validator(mode="before")
    @classmethod
    def normalize_dispatch(cls, data: dict):
        if not isinstance(data, dict):
            return data
        if "emergency_call_id" in data and "incident_id" not in data:
            data["incident_id"] = data["emergency_call_id"]
        elif "incident_id" in data and "emergency_call_id" not in data:
            data["emergency_call_id"] = data["incident_id"]
        return data


class AmbulanceDispatchVoucherResponse(BaseModel):
    hospital_name_en: str
    hospital_name_om: str
    tin_number: str
    telephone: str
    incident_code: str
    caller_name: str
    caller_phone: str
    incident_location: str
    triage_level: str
    chief_complaint: str
    ambulance_call_sign: str
    ambulance_plate: str
    paramedic_crew: str
    vital_signs: str
    dispatch_time: str
    hospital_arrival_time: str
    verification_qr: str
