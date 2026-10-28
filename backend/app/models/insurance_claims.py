"""
CBHI & EHIA Insurance Claims Management ORM models.
Facilitates Community-Based Health Insurance (CBHI) batch submissions, adjudication, and reimbursement tracking.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ClaimStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"


class InsuranceType(str, enum.Enum):
    CBHI = "cbhi" # Community-Based Health Insurance
    EHIA_CIVIL_SERVANT = "ehia_civil_servant" # Ethiopian Health Insurance Agency Public Servants
    PRIVATE = "private"


class InsuranceClaimBatch(Base):
    """Monthly or periodic electronic claim batch submitted to Woreda CBHI Office or EHIA."""
    __tablename__ = "insurance_claim_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "CBHI-METTU-2026-10"
    insurance_type: Mapped[InsuranceType] = mapped_column(
        Enum(InsuranceType, name="insurance_type_enum", native_enum=False),
        default=InsuranceType.CBHI,
        nullable=False,
    )
    woreda_name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Mettu Woreda Health Pool"
    billing_period: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "October 2026 (Tikimt 2019)"
    
    total_claims_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_amount_etb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    approved_amount_etb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus, name="claim_batch_status_enum", native_enum=False),
        default=ClaimStatus.DRAFT,
        nullable=False,
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reimbursed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    claims: Mapped[list["PatientInsuranceClaim"]] = relationship("PatientInsuranceClaim", back_populates="batch")


class PatientInsuranceClaim(Base):
    """Individual encounter medical claim submitted for CBHI/EHIA reimbursement."""
    __tablename__ = "patient_insurance_claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[Optional[int]] = mapped_column(ForeignKey("insurance_claim_batches.id", ondelete="SET NULL"), nullable=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    
    cbhi_id_number: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "CBHI-MET-09-11204"
    claim_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "CLM-2026-0091"
    
    service_category: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Inpatient Surgery", "Outpatient Labs & Drugs"
    total_cost_etb: Mapped[float] = mapped_column(Float, nullable=False)
    patient_copay_etb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    claimed_amount_etb: Mapped[float] = mapped_column(Float, nullable=False)
    approved_amount_etb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus, name="claim_status_enum", native_enum=False),
        default=ClaimStatus.SUBMITTED,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    batch: Mapped[Optional["InsuranceClaimBatch"]] = relationship("InsuranceClaimBatch", back_populates="claims")
    patient: Mapped["Patient"] = relationship("Patient")
