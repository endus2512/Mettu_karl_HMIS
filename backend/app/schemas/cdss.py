"""
Pydantic schemas for Clinical Decision Support System (CDSS) and interaction checking.
"""
from typing import List, Optional
from pydantic import BaseModel

from app.models.cdss import SeverityLevel


class CheckPrescriptionRequest(BaseModel):
    patient_id: int
    drug_names: List[str]


class CDSSInteractionWarning(BaseModel):
    drug_a: str
    drug_b: str
    severity: SeverityLevel
    clinical_effect: str
    recommendation: str


class CDSSAllergyWarning(BaseModel):
    drug_name: str
    allergen_substance: str
    reaction: str
    severity: SeverityLevel


class CDSSCheckResult(BaseModel):
    has_critical_alerts: bool
    has_warnings: bool
    interactions: List[CDSSInteractionWarning] = []
    allergies: List[CDSSAllergyWarning] = []
    summary_message: str
