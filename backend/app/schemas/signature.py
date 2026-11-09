"""
Pydantic schemas for Clinical PKI Digital Signatures.
Compliant with Ethiopian Electronic Signature Proclamation No. 1072/2018.
"""
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class ClinicalSignatureCreate(BaseModel):
    document_type: str = Field(..., description="discharge_summary, prescription, surgical_note, death_certificate")
    document_id: str = Field(..., description="Document ID or Order Number, e.g. 'RX-2026-9021'")
    clinician_license_number: Optional[str] = Field("ETH-MD-9921", description="Oromia Health Bureau License Number")
    document_payload: Dict[str, Any] = Field(..., description="Full canonical medical record content to be cryptographically signed")


class ClinicalSignatureVerifyRequest(BaseModel):
    document_type: str
    document_id: str
    verification_seal: str
    document_payload: Dict[str, Any]


class ClinicalSignatureResponse(BaseModel):
    id: int
    document_type: str
    document_id: str
    signer_full_name: str
    signer_role: str
    clinician_license_number: str
    document_payload_hash: str
    verification_seal: str
    algorithm: str
    signed_at: datetime
    is_valid: bool = True
    tamper_detected: bool = False
    message: str = "Cryptographically sealed and verified"

    model_config = ConfigDict(from_attributes=True)


class VerificationAuditResult(BaseModel):
    document_id: str
    document_type: str
    verification_seal: str
    signer_full_name: str
    signer_license: str
    is_authentic: bool
    tamper_detected: bool
    signed_timestamp: datetime
    verification_message: str
