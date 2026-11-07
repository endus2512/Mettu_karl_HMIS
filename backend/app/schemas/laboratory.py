"""
Pydantic v2 schemas for Laboratory Information System (LIS).
Validation for lab test catalog, physician requisitions, specimen accessioning,
result recording with out-of-range/critical panic flagging, and clinical statistics.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.laboratory import (
    LabCategory,
    LabOrderPriority,
    LabOrderStatus,
    ResultFlag,
    SpecimenType,
)


class LabParameterDef(BaseModel):
    name: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    min_ref: Optional[float] = None
    max_ref: Optional[float] = None
    critical_low: Optional[float] = None
    critical_high: Optional[float] = None


class LabTestCatalogBase(BaseModel):
    test_code: str = Field(..., max_length=50)
    test_name: str = Field(..., max_length=200)
    name_om: Optional[str] = Field(None, max_length=200)
    category: LabCategory
    specimen_type: SpecimenType
    tube_color: str = Field("Lavender / Purple Top", max_length=60)
    loinc_code: Optional[str] = Field(None, max_length=50)
    price_etb: float = Field(default=0.0, ge=0.0)
    turnaround_time_mins: int = Field(default=60, ge=5)
    parameters_json: Optional[str] = None
    is_active: bool = True


class LabTestCatalogCreate(LabTestCatalogBase):
    pass


class LabTestCatalogResponse(LabTestCatalogBase):
    id: int
    parameters: List[LabParameterDef] = []

    model_config = {"from_attributes": True}


class LabResultItemCreate(BaseModel):
    parameter_name: str
    result_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    flag: ResultFlag = ResultFlag.NORMAL
    notes: Optional[str] = None


class LabResultsSubmitRequest(BaseModel):
    results: List[LabResultItemCreate]
    overall_notes: Optional[str] = None


class SampleCollectionRequest(BaseModel):
    sample_barcode: Optional[str] = None
    notes: Optional[str] = None


class LabResultResponse(BaseModel):
    id: int
    test_catalog_id: int
    parameter_name: str
    result_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    flag: ResultFlag
    notes: Optional[str] = None
    recorded_at: datetime
    technologist_name: Optional[str] = None

    model_config = {"from_attributes": True}


class LabOrderItemResponse(BaseModel):
    id: int
    test_catalog_id: int
    test_code: str
    test_name: str
    name_om: Optional[str] = None
    category: LabCategory
    specimen_type: SpecimenType
    tube_color: str
    loinc_code: Optional[str] = None
    price_etb: float
    status: str

    model_config = {"from_attributes": True}


class LabOrderCreate(BaseModel):
    patient_id: int
    priority: LabOrderPriority = LabOrderPriority.ROUTINE
    clinical_notes: Optional[str] = Field(None, max_length=255)
    test_catalog_ids: List[int] = Field(..., min_length=1)


class LabOrderResponse(BaseModel):
    id: int
    order_number: str
    patient_id: int
    patient_mrn: str
    patient_name: str
    patient_gender: str
    patient_age: int
    patient_phone: Optional[str] = None
    ordering_doctor_name: str
    priority: LabOrderPriority
    clinical_notes: Optional[str] = None
    status: LabOrderStatus
    ordered_at: datetime
    sample_collected_at: Optional[datetime] = None
    sample_barcode: Optional[str] = None
    sample_collector_name: Optional[str] = None
    completed_at: Optional[datetime] = None
    verified_by_name: Optional[str] = None
    has_critical_flag: bool
    billing_invoice_id: Optional[int] = None
    items: List[LabOrderItemResponse] = []
    results: List[LabResultResponse] = []

    model_config = {"from_attributes": True}


class LabStatsResponse(BaseModel):
    pending_orders_count: int
    samples_collected_count: int
    processing_count: int
    completed_today_count: int
    critical_panic_count: int
    stat_urgent_count: int
    total_tests_conducted: int
