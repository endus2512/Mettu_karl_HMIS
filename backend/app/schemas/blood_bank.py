"""
Pydantic schemas for Blood Bank, Donor Registry, Cold Chain Inventory, and Crossmatch testing.
Mettu Karl Comprehensive Specialized Hospital — High-Precision Hemovigilance Standards.
"""
from datetime import date, datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field, field_validator

from app.models.blood_bank import BloodGroup, BloodUnitStatus, ComponentType


def normalize_blood_group(v: Any) -> BloodGroup:
    if isinstance(v, BloodGroup):
        return v
    if isinstance(v, str):
        mapping = {
            "O_POS": BloodGroup.O_POS, "O+": BloodGroup.O_POS, "O_POSITIVE": BloodGroup.O_POS,
            "O_NEG": BloodGroup.O_NEG, "O-": BloodGroup.O_NEG, "O_NEGATIVE": BloodGroup.O_NEG,
            "A_POS": BloodGroup.A_POS, "A+": BloodGroup.A_POS, "A_POSITIVE": BloodGroup.A_POS,
            "A_NEG": BloodGroup.A_NEG, "A-": BloodGroup.A_NEG, "A_NEGATIVE": BloodGroup.A_NEG,
            "B_POS": BloodGroup.B_POS, "B+": BloodGroup.B_POS, "B_POSITIVE": BloodGroup.B_POS,
            "B_NEG": BloodGroup.B_NEG, "B-": BloodGroup.B_NEG, "B_NEGATIVE": BloodGroup.B_NEG,
            "AB_POS": BloodGroup.AB_POS, "AB+": BloodGroup.AB_POS, "AB_POSITIVE": BloodGroup.AB_POS,
            "AB_NEG": BloodGroup.AB_NEG, "AB-": BloodGroup.AB_NEG, "AB_NEGATIVE": BloodGroup.AB_NEG,
        }
        if v.upper() in mapping:
            return mapping[v.upper()]
    return BloodGroup.O_POS


def normalize_component_type(v: Any) -> ComponentType:
    if isinstance(v, ComponentType):
        return v
    if isinstance(v, str):
        v_upper = v.upper()
        if v_upper in ("PRBC", "PACKED_RBC", "PACKED RED BLOOD CELLS"):
            return ComponentType.PACKED_RBC
        if v_upper in ("FFP", "FRESH_FROZEN_PLASMA", "PLASMA"):
            return ComponentType.FRESH_FROZEN_PLASMA
        if v_upper in ("PLT", "PLATELETS", "PLATELET CONCENTRATE"):
            return ComponentType.PLATELETS
        if v_upper in ("CRYO", "CRYOPRECIPITATE"):
            return ComponentType.CRYOPRECIPITATE
        if v_upper in ("WHOLE", "WHOLE_BLOOD"):
            return ComponentType.WHOLE_BLOOD
    return ComponentType.PACKED_RBC


class BloodUnitCreate(BaseModel):
    unit_barcode: Optional[str] = None
    unit_number: Optional[str] = None
    donor_id: Optional[int] = None
    blood_group: BloodGroup
    component_type: ComponentType = ComponentType.PACKED_RBC
    volume_ml: int = 450
    collected_at: Optional[datetime] = None
    collected_date: Optional[Any] = None
    expiry_date: Any
    storage_location: str = "Walk-In Blood Refrigerator #1"
    storage_temperature_celsius: float = 4.0
    tested_negative_hiv: bool = True
    tested_negative_hep_b: bool = True
    tested_negative_hep_c: bool = True
    tested_negative_syphilis: bool = True

    @field_validator("blood_group", mode="before")
    @classmethod
    def parse_bg(cls, v):
        return normalize_blood_group(v)

    @field_validator("component_type", mode="before")
    @classmethod
    def parse_comp(cls, v):
        return normalize_component_type(v)


class BloodUnitResponse(BaseModel):
    id: int
    unit_barcode: str
    unit_number: str
    donor_id: Optional[int] = None
    donor_name: Optional[str] = None
    blood_group: str
    component_type: str
    volume_ml: int = 450
    collected_at: datetime
    expiry_date: datetime
    storage_location: str = "Walk-In Blood Refrigerator #1"
    storage_temperature_celsius: float = 4.0
    status: BloodUnitStatus = BloodUnitStatus.AVAILABLE
    tested_negative_hiv: bool = True
    tested_negative_hep_b: bool = True
    tested_negative_hep_c: bool = True
    tested_negative_syphilis: bool = True

    model_config = {"from_attributes": True}


class BloodGroupStock(BaseModel):
    blood_group: str
    units_available: int
    total_units: int
    prbc_units: int
    plasma_units: int
    platelet_units: int
    is_critical_shortage: bool
    min_threshold: int = 5


class CrossMatchRequest(BaseModel):
    patient_id: int
    blood_unit_id: int
    patient_blood_group: Optional[str] = None
    crossmatch_method: str = "Indirect Antiglobulin Test (IAT)"
    is_compatible: Optional[bool] = None
    notes: Optional[str] = None


class CrossMatchResponse(BaseModel):
    id: int
    crossmatch_code: Optional[str] = None
    patient_id: int
    patient_name: Optional[str] = None
    patient_mrn: Optional[str] = None
    patient_blood_group: Optional[str] = None
    blood_unit_id: int
    blood_unit_barcode: Optional[str] = None
    blood_unit_group: Optional[str] = None
    blood_unit_component: Optional[str] = None
    is_compatible: bool
    crossmatch_method: str = "Indirect Antiglobulin Test (IAT)"
    status: str = "compatible"
    tested_at: datetime
    technologist_id: int
    technologist_name: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class BloodDonorCreate(BaseModel):
    full_name: str
    phone_number: str
    blood_group: BloodGroup
    last_donation_date: Optional[date] = None
    total_donations_count: int = 1
    is_eligible: bool = True

    @field_validator("blood_group", mode="before")
    @classmethod
    def parse_bg(cls, v):
        return normalize_blood_group(v)


class BloodDonorResponse(BaseModel):
    id: int
    donor_code: str
    full_name: str
    phone_number: str
    blood_group: str
    last_donation_date: Optional[date] = None
    total_donations_count: int = 1
    is_eligible: bool = True

    model_config = {"from_attributes": True}


class BloodBankStatsResponse(BaseModel):
    total_units: int
    total_prbc: int
    total_plasma: int
    total_platelets: int
    o_neg_critical_count: int
    active_crossmatches_count: int
    transfused_today_count: int
    total_donors_count: int
    cold_chain_alarm_active: bool = False
    refrigerator_temperature_celsius: float = 3.8
    freezer_temperature_celsius: float = -26.4
    agitator_temperature_celsius: float = 22.1


class BloodTransfusionVoucherResponse(BaseModel):
    hospital_name_en: str
    hospital_name_om: str
    tin_number: str
    accreditation_level: str
    telephone: str
    location: str
    crossmatch_code: str
    tested_at: datetime
    patient_mrn: str
    patient_name: str
    patient_age: int
    patient_gender: str
    patient_blood_group: str
    blood_unit_barcode: str
    blood_unit_group: str
    component_type: str
    volume_ml: int
    expiry_date: datetime
    storage_location: str
    is_compatible: bool
    compatibility_verdict: str
    crossmatch_method: str
    tested_negative_screens: str
    technologist_name: str
    issued_timestamp: datetime
    verification_qr: str
