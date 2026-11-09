"""
Clinical PKI Digital Signature ORM models.
Compliant with Ethiopian Electronic Signature Proclamation No. 1072/2018.
Provides tamper-evident cryptographic sealing for medical prescriptions,
discharge summaries, operative surgical notes, and death certificates.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ClinicalDocumentType(str, enum.Enum):
    DISCHARGE_SUMMARY = "discharge_summary"
    PRESCRIPTION = "prescription"
    SURGICAL_NOTE = "surgical_note"
    DEATH_CERTIFICATE = "death_certificate"
    LAB_REPORT = "lab_report"
    CONSULTATION_NOTE = "consultation_note"


class ClinicalDigitalSignature(Base):
    """
    Cryptographic non-repudiation audit trail for high-stakes medical records.
    Contains canonical SHA-256 payload digest and clinician digital certificate seal.
    """
    __tablename__ = "clinical_digital_signatures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    document_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    document_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    
    signer_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    signer_full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    signer_role: Mapped[str] = mapped_column(String(50), nullable=False)
    clinician_license_number: Mapped[str] = mapped_column(String(50), default="ETH-MD-9921", nullable=False)
    
    # Cryptographic integrity
    document_payload_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 hex
    signature_token: Mapped[str] = mapped_column(Text, nullable=False)             # Base64 signature
    verification_seal: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False) # e.g. "MKH-SEAL-2026-F890A"
    algorithm: Mapped[str] = mapped_column(String(50), default="SHA256withRSA", nullable=False)
    public_key_fingerprint: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revocation_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    signed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
