"""
Pydantic schemas for Medical Waste Management, Segregation, and Incineration.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.waste import DisposalMethod, WasteCategory


class MedicalWasteLogCreate(BaseModel):
    department: str
    category: WasteCategory
    weight_kg: float = Field(..., gt=0.0)
    handler_name: str
    disposal_method: DisposalMethod = DisposalMethod.INCINERATION


class MedicalWasteLogResponse(MedicalWasteLogCreate):
    id: int
    waste_code: str
    collected_at: datetime
    disposed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class IncineratorBatchCreate(BaseModel):
    total_weight_kg: float = Field(..., gt=0.0)
    chamber_1_temp_celsius: float = 850.0
    chamber_2_temp_celsius: float = 1100.0
    burn_duration_min: int = 90
    operator_name: str


class IncineratorBatchResponse(IncineratorBatchCreate):
    id: int
    batch_code: str
    emission_scrubber_normal: bool
    burned_at: datetime

    model_config = {"from_attributes": True}
