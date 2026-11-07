"""
Pydantic schemas for Inpatient Department (IPD), Ward & Bed Occupancy Management.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class WardBedBase(BaseModel):
    bed_number: str
    bed_type: str = "standard"
    status: str = "available"
    daily_rate_etb: float = 150.0
    oxygen_supplied: bool = True
    has_monitor: bool = False


class WardBedStatusUpdate(BaseModel):
    status: str = Field(..., description="available, occupied, cleaning, maintenance, reserved")


class WardBedResponse(BaseModel):
    id: int
    ward_id: int
    bed_number: str
    bed_type: str
    status: str
    daily_rate_etb: float
    oxygen_supplied: bool
    has_monitor: bool
    current_admission_id: Optional[int] = None
    ward_code: Optional[str] = None
    ward_name_en: Optional[str] = None
    ward_name_om: Optional[str] = None
    patient_id: Optional[int] = None
    patient_name: Optional[str] = None
    patient_mrn: Optional[str] = None
    admission_number: Optional[str] = None
    acuity_level: Optional[str] = None
    admission_date: Optional[datetime] = None

    model_config = {"from_attributes": True}


class WardResponse(BaseModel):
    id: int
    ward_code: str
    name_en: str
    name_om: str
    department: str
    floor_location: str
    head_nurse: str
    is_active: bool
    total_beds: int = 0
    occupied_beds: int = 0
    available_beds: int = 0
    cleaning_beds: int = 0
    maintenance_beds: int = 0
    occupancy_rate: float = 0.0

    model_config = {"from_attributes": True}


class WardWithBedsResponse(WardResponse):
    beds: List[WardBedResponse] = []


class InpatientAdmissionCreate(BaseModel):
    patient_id: int
    ward_id: int
    bed_id: int
    admitting_doctor_id: Optional[int] = None
    primary_nurse_id: Optional[int] = None
    admitting_diagnosis: str = Field(..., min_length=2, max_length=255)
    icd10_code: Optional[str] = Field(None, max_length=20)
    admission_type: str = Field("emergency", description="emergency, elective_surgical, internal_transfer, referral")
    acuity_level: str = Field("moderate", description="critical, high, moderate, stable")
    diet_category: str = Field("regular", description="regular, diabetic, renal, npo_fasting, soft")
    payment_method: str = Field("cash", description="cash, cbhi, private_insurance, free_exempted")


class InpatientAdmissionResponse(BaseModel):
    id: int
    admission_number: str
    patient_id: int
    patient_mrn: str
    patient_name: str
    patient_gender: str
    patient_age: int
    ward_id: int
    ward_name: str
    bed_id: int
    bed_number: str
    admitting_doctor_name: str
    primary_nurse_name: str
    admitting_diagnosis: str
    icd10_code: Optional[str] = None
    admission_type: str
    acuity_level: str
    diet_category: str
    payment_method: str
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    discharge_summary: Optional[str] = None
    discharge_condition: Optional[str] = None
    total_days: int
    total_bed_charge_etb: float
    status: str

    model_config = {"from_attributes": True}


class BedTransferRequest(BaseModel):
    to_ward_id: int
    to_bed_id: int
    transfer_reason: str = Field(..., min_length=3, max_length=255)


class BedTransferLogResponse(BaseModel):
    id: int
    admission_id: int
    admission_number: str
    patient_name: str
    from_ward_name: str
    from_bed_number: str
    to_ward_name: str
    to_bed_number: str
    transferred_by_name: str
    transfer_reason: str
    transferred_at: datetime

    model_config = {"from_attributes": True}


class InpatientDischargeRequest(BaseModel):
    discharge_summary: str = Field(..., min_length=5)
    discharge_condition: str = Field("cured_improved", description="cured_improved, transferred, lama, deceased")


class InpatientStatsResponse(BaseModel):
    total_beds: int
    occupied_beds: int
    available_beds: int
    cleaning_beds: int
    maintenance_beds: int
    overall_occupancy_rate: float
    active_admissions_count: int
    critical_patients_count: int
    today_admissions_count: int
    today_discharges_count: int


class InpatientDischargeVoucherResponse(BaseModel):
    hospital_name_en: str
    hospital_name_om: str
    tin_number: str
    accreditation_level: str
    telephone: str
    location: str
    admission_number: str
    admission_date: datetime
    discharge_date: datetime
    total_stay_days: int
    daily_rate_etb: float
    total_bed_charge_etb: float
    patient_mrn: str
    patient_name: str
    patient_age: int
    patient_gender: str
    patient_address: str
    ward_name: str
    bed_number: str
    payment_category: str
    admitting_diagnosis: str
    icd10_code: Optional[str]
    discharge_summary: str
    discharge_condition: str
    attending_physician: str
    issued_timestamp: datetime
    verification_qr: str
