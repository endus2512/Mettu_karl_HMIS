"""
Pydantic schemas for Pharmacy, Drug Inventory, and FEFO Prescriptions.
"""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.pharmacy import DosageForm, MovementType, PrescriptionStatus


class DrugCreate(BaseModel):
    name: str
    generic_name: str
    dosage_form: DosageForm
    strength: str
    unit_price: float = Field(..., gt=0.0)
    reorder_level: int = 50


class DrugResponse(DrugCreate):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


class DrugBatchCreate(BaseModel):
    drug_id: int
    batch_number: str
    manufacture_date: Optional[date] = None
    expiry_date: date
    initial_quantity: int = Field(..., gt=0)
    cost_price: float = Field(0.0, ge=0.0)


class DrugBatchResponse(DrugBatchCreate):
    id: int
    current_quantity: int
    is_expiring_soon: bool = False
    is_expired: bool = False

    model_config = {"from_attributes": True}


class PrescriptionItemCreate(BaseModel):
    drug_id: int
    dosage: str
    frequency: str
    duration_days: int = Field(default=5, ge=1)
    quantity_prescribed: int = Field(..., gt=0)
    instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    patient_id: int
    items: List[PrescriptionItemCreate]
    clinical_notes: Optional[str] = None


class PrescriptionItemResponse(BaseModel):
    id: int
    drug_id: int
    drug_name: Optional[str] = None
    batch_id: Optional[int] = None
    dosage: str
    frequency: str
    duration_days: int
    quantity_prescribed: int
    quantity_dispensed: int
    instructions: Optional[str] = None

    model_config = {"from_attributes": True}


class PrescriptionResponse(BaseModel):
    id: int
    prescription_code: str
    patient_id: int
    prescriber_id: int
    status: PrescriptionStatus
    clinical_notes: Optional[str] = None
    created_at: datetime
    dispensed_at: Optional[datetime] = None
    items: List[PrescriptionItemResponse] = []

    model_config = {"from_attributes": True}


class StockAlert(BaseModel):
    drug_id: int
    drug_name: str
    generic_name: str
    alert_type: str  # "LOW_STOCK", "EXPIRING_SOON", "EXPIRED"
    message: str
    total_quantity: int
    expiry_date: Optional[date] = None
