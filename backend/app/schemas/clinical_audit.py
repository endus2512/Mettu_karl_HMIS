"""
Pydantic schemas for Clinical Audit, Quality Governance & EHSTG Accreditation.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.clinical_audit import AuditStatus, EHSTGStandardChapter


class ClinicalAuditCreate(BaseModel):
    audit_code: str
    chapter: EHSTGStandardChapter
    department: str
    audit_date: date
    auditor_name: str
    compliance_score_percent: float = Field(..., ge=0.0, le=100.0)
    findings_summary: str


class ClinicalAuditResponse(ClinicalAuditCreate):
    id: int
    status: AuditStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class CAPACreate(BaseModel):
    audit_id: int
    issue_description: str
    corrective_action: str
    assigned_to: str
    deadline_date: date


class CAPAResponse(CAPACreate):
    id: int
    is_resolved: bool
    resolved_date: Optional[date] = None

    model_config = {"from_attributes": True}


class SecurityAuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    user_id: Optional[int] = None
    action: str
    resource: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    result: str
    detail: Optional[str] = None
    entry_hash: Optional[str] = None
    previous_hash: Optional[str] = None
    chain_index: Optional[int] = None
    signature_seal: Optional[str] = None

    model_config = {"from_attributes": True}


class MerkleChainVerifyResponse(BaseModel):
    is_valid: bool
    total_records_checked: int
    genesis_hash: Optional[str] = None
    head_hash: Optional[str] = None
    status: str
    compliance_standard: str = "Ethiopian INSA National Cybersecurity & HIPAA Forensic Grade"
    message: str
    broken_at_id: Optional[int] = None
    broken_at_chain_index: Optional[int] = None
    tampering_type: Optional[str] = None

