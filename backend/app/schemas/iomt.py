"""
Pydantic schemas for IoMT Medical Telemetry and Real-Time Vital Alerts.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.iomt import AlarmSeverity, DeviceType


class IoMTDeviceCreate(BaseModel):
    device_uid: str
    name: str
    device_type: DeviceType
    ward: str
    bed_number: str
    current_patient_id: Optional[int] = None


class IoMTDeviceResponse(IoMTDeviceCreate):
    id: int
    is_online: bool
    last_ping: datetime

    model_config = {"from_attributes": True}


class VitalTelemetryCreate(BaseModel):
    device_id: int
    patient_id: int
    heart_rate_bpm: int = Field(..., ge=20, le=280)
    spo2_percent: int = Field(..., ge=40, le=100)
    systolic_bp_mmhg: Optional[int] = Field(None, ge=40, le=300)
    diastolic_bp_mmhg: Optional[int] = Field(None, ge=20, le=200)
    respiratory_rate: Optional[int] = Field(None, ge=5, le=80)
    temperature_celsius: Optional[float] = Field(None, ge=30.0, le=45.0)


class VitalTelemetryResponse(VitalTelemetryCreate):
    id: int
    recorded_at: datetime

    model_config = {"from_attributes": True}


class TelemetryAlarmResponse(BaseModel):
    id: int
    device_id: int
    patient_id: int
    alarm_title: str
    severity: AlarmSeverity
    metric_value: str
    triggered_at: datetime
    is_acknowledged: bool

    model_config = {"from_attributes": True}
