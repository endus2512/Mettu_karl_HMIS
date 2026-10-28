"""
Ethiopian Food and Drug Authority (EFDA) Compliance & Drug Safety ORM models.
Includes Adverse Drug Reaction (ADR) Pharmacovigilance (Yellow Form) and Recall Alerts.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ADRSeverity(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    LIFE_THREATENING = "life_threatening"
    FATAL = "fatal"


class ADRStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_EVALUATION = "under_evaluation"
    REPORTED_TO_EFDA = "reported_to_efda"
    ARCHIVED = "archived"


class EFDAPharmacovigilanceReport(Base):
    """ADR Yellow Form submitted to EFDA National Pharmacovigilance Centre."""
    __tablename__ = "efda_adr_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "ADR-MKH-2026-0042"
    
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    drug_id: Mapped[Optional[int]] = mapped_column(ForeignKey("drugs.id", ondelete="SET NULL"), nullable=True)
    
    suspected_drug_name: Mapped[str] = mapped_column(String(200), nullable=False)
    batch_number: Mapped[str] = mapped_column(String(100), nullable=False)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    
    reaction_description: Mapped[str] = mapped_column(Text, nullable=False)
    onset_date: Mapped[date] = mapped_column(Date, nullable=False)
    severity: Mapped[ADRSeverity] = mapped_column(
        Enum(ADRSeverity, name="adr_severity_enum", native_enum=False),
        default=ADRSeverity.MODERATE,
        nullable=False,
    )
    status: Mapped[ADRStatus] = mapped_column(
        Enum(ADRStatus, name="adr_status_enum", native_enum=False),
        default=ADRStatus.SUBMITTED,
        nullable=False,
    )
    
    dechallenge_outcome: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "Reaction subsided after stopping drug"
    rechallenge_outcome: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "Not reintroduced"
    
    reporter_name: Mapped[str] = mapped_column(String(150), nullable=False)
    reporter_role: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Clinical Pharmacist", "Attending Physician"
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship("Patient")
    drug: Mapped[Optional["Drug"]] = relationship("Drug")


class EFDADrugRecall(Base):
    """Regulatory drug safety alert or substandard batch recall issued by EFDA."""
    __tablename__ = "efda_drug_recalls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recall_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "RCL-EFDA-2026-09"
    drug_name: Mapped[str] = mapped_column(String(200), nullable=False)
    affected_batches: Mapped[str] = mapped_column(String(255), nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(150), nullable=False)
    reason_for_recall: Mapped[str] = mapped_column(Text, nullable=False) # e.g. "Particulate contamination in ampoules"
    is_quarantine_enforced: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    issued_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
