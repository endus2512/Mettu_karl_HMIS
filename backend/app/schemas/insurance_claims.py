"""
Pydantic schemas for CBHI & EHIA Insurance Claims and Batch Reimbursements.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.insurance_claims import ClaimStatus, InsuranceType


class InsuranceClaimBatchCreate(BaseModel):
    batch_number: str
    insurance_type: InsuranceType = InsuranceType.CBHI
    woreda_name: str
    billing_period: str


class InsuranceClaimBatchResponse(InsuranceClaimBatchCreate):
    id: int
    total_claims_count: int
    total_amount_etb: float
    approved_amount_etb: float
    status: ClaimStatus
    submitted_at: Optional[datetime] = None
    reimbursed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PatientInsuranceClaimCreate(BaseModel):
    batch_id: Optional[int] = None
    patient_id: int
    cbhi_id_number: str
    service_category: str
    total_cost_etb: float = Field(..., gt=0.0)
    patient_copay_etb: float = Field(0.0, ge=0.0)
    claimed_amount_etb: float = Field(..., gt=0.0)


class PatientInsuranceClaimResponse(PatientInsuranceClaimCreate):
    id: int
    claim_number: str
    approved_amount_etb: Optional[float] = None
    rejection_reason: Optional[str] = None
    status: ClaimStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class ClaimAdjudicationRequest(BaseModel):
    status: ClaimStatus
    approved_amount_etb: float = Field(..., ge=0.0)
    rejection_reason: Optional[str] = None
