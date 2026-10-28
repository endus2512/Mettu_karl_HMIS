"""
Pydantic schemas for Ethiopian Food and Drug Authority (EFDA) Pharmacovigilance and Drug Recalls.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.efda import ADRSeverity, ADRStatus


class ADRReportCreate(BaseModel):
    patient_id: int
    drug_id: Optional[int] = None
    suspected_drug_name: str
    batch_number: str
    manufacturer: Optional[str] = None
    reaction_description: str
    onset_date: date
    severity: ADRSeverity = ADRSeverity.MODERATE
    dechallenge_outcome: Optional[str] = None
    rechallenge_outcome: Optional[str] = None
    reporter_name: str
    reporter_role: str


class ADRReportResponse(ADRReportCreate):
    id: int
    report_number: str
    status: ADRStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class DrugRecallCreate(BaseModel):
    recall_number: str
    drug_name: str
    affected_batches: str
    manufacturer: str
    reason_for_recall: str
    is_quarantine_enforced: bool = True
    issued_date: date


class DrugRecallResponse(DrugRecallCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
