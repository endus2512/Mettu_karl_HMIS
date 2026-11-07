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


class BatchDetail(BaseModel):
    id: int
    batch_number: str
    manufacture_date: Optional[date] = None
    expiry_date: date
    initial_quantity: int
    current_quantity: int
    cost_price: float
    days_to_expiry: int
    status: str  # "good", "expiring_soon", "expired", "depleted"

    model_config = {"from_attributes": True}


class DrugInventoryItemResponse(BaseModel):
    id: int
    name: str
    generic_name: str
    dosage_form: DosageForm
    strength: str
    unit_price: float
    reorder_level: int
    is_active: bool
    total_quantity: int
    status: str  # "good", "low", "expiring", "out_of_stock"
    earliest_expiry: Optional[date] = None
    batches: List[BatchDetail] = []

    model_config = {"from_attributes": True}


class PatientBrief(BaseModel):
    id: int
    mrn: str
    first_name: str
    last_name: str
    gender: str
    birth_date: Optional[date] = None
    phone_number: Optional[str] = None


class PrescriberBrief(BaseModel):
    id: int
    username: str
    full_name: str
    role: str


class PrescriptionItemDetail(BaseModel):
    id: int
    drug_id: int
    drug_name: str
    generic_name: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    unit_price: float
    total_price: float
    dosage: str
    frequency: str
    duration_days: int
    quantity_prescribed: int
    quantity_dispensed: int
    instructions: Optional[str] = None
    batch_id: Optional[int] = None
    batch_number: Optional[str] = None
    is_fully_dispensed: bool


class PrescriptionDetailResponse(BaseModel):
    id: int
    prescription_code: str
    patient_id: int
    patient: Optional[PatientBrief] = None
    prescriber_id: int
    prescriber: Optional[PrescriberBrief] = None
    status: PrescriptionStatus
    clinical_notes: Optional[str] = None
    created_at: datetime
    dispensed_at: Optional[datetime] = None
    items: List[PrescriptionItemDetail] = []
    total_amount: float = 0.0


class StockMovementResponse(BaseModel):
    id: int
    drug_id: int
    drug_name: str
    batch_id: int
    batch_number: str
    movement_type: MovementType
    quantity: int
    balance_after: int
    reference_number: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None

    model_config = {"from_attributes": True}


class DispensedBatchUsage(BaseModel):
    batch_id: int
    batch_number: str
    expiry_date: date
    quantity_deducted: int


class DispenseItemResult(BaseModel):
    item_id: int
    drug_id: int
    drug_name: str
    quantity_prescribed: int
    quantity_dispensed_now: int
    total_dispensed: int
    batches_used: List[DispensedBatchUsage] = []


class DispenseResultResponse(BaseModel):
    prescription_id: int
    prescription_code: str
    status: PrescriptionStatus
    dispensed_at: datetime
    message: str
    items: List[DispenseItemResult] = []

