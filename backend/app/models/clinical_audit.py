"""
Clinical Audit, Quality Governance & EHSTG Accreditation ORM models.
Supports Ethiopian Hospital Services Transformation Guidelines (EHSTG / EHHS) standards auditing and CAPA tracking.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EHSTGStandardChapter(str, enum.Enum):
    IPPS_INFECTION_PREVENTION = "infection_prevention_safety"
    CLINICAL_DOCUMENTATION = "clinical_documentation_audit"
    SURGICAL_SAFETY = "surgical_safety_checklist"
    EMERGENCY_TRIAGE = "emergency_services_triage"
    PHARMACY_SERVICES = "pharmacy_fefo_rational_use"
    NURSING_CARE = "nursing_standards_vitals"


class AuditStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CAPA_PENDING = "capa_pending"


class ClinicalAudit(Base):
    """Departmental quality compliance audit against EHSTG national standards."""
    __tablename__ = "clinical_audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    audit_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "AUD-EHSTG-2026-Q4-01"
    chapter: Mapped[EHSTGStandardChapter] = mapped_column(
        Enum(EHSTGStandardChapter, name="ehstg_chapter_enum", native_enum=False),
        nullable=False,
    )
    department: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Operation Theatre", "Inpatient Pediatrics"
    audit_date: Mapped[date] = mapped_column(Date, nullable=False)
    auditor_name: Mapped[str] = mapped_column(String(150), nullable=False) # e.g. "Dr. Chala (Quality Officer)"
    
    compliance_score_percent: Mapped[float] = mapped_column(Float, nullable=False) # e.g. 88.5%
    status: Mapped[AuditStatus] = mapped_column(
        Enum(AuditStatus, name="audit_status_enum", native_enum=False),
        default=AuditStatus.COMPLETED,
        nullable=False,
    )
    findings_summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    capa_items: Mapped[list["CorrectiveActionPlan"]] = relationship("CorrectiveActionPlan", back_populates="audit")


class CorrectiveActionPlan(Base):
    """Corrective and Preventive Action (CAPA) assigned to address quality non-compliances."""
    __tablename__ = "corrective_action_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    audit_id: Mapped[int] = mapped_column(ForeignKey("clinical_audits.id", ondelete="CASCADE"), index=True)
    
    issue_description: Mapped[str] = mapped_column(Text, nullable=False)
    corrective_action: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_to: Mapped[str] = mapped_column(String(150), nullable=False) # e.g. "Nurse Matron Almaz"
    deadline_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resolved_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    audit: Mapped["ClinicalAudit"] = relationship("ClinicalAudit", back_populates="capa_items")
