"""
Pydantic schemas for Blood Bank, Donor Registry, and Crossmatch testing.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.blood_bank import BloodGroup, BloodUnitStatus, ComponentType


class BloodUnitCreate(BaseModel):
    unit_barcode: str
    donor_id: Optional[int] = None
    blood_group: BloodGroup
    component_type: ComponentType
    volume_ml: int = 450
    collected_at: datetime
    expiry_date: datetime
    storage_temperature_celsius: float = 4.0


class BloodUnitResponse(BloodUnitCreate):
    id: int
    status: BloodUnitStatus

    model_config = {"from_attributes": True}


class CrossMatchRequest(BaseModel):
    patient_id: int
    blood_unit_id: int
    is_compatible: bool
    notes: Optional[str] = None


class CrossMatchResponse(BaseModel):
    id: int
    patient_id: int
    blood_unit_id: int
    is_compatible: bool
    tested_at: datetime
    technologist_id: int
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class BloodGroupStock(BaseModel):
    blood_group: BloodGroup
    total_units: int
    prbc_units: int
    plasma_units: int
    platelet_units: int
    is_critical_shortage: bool
