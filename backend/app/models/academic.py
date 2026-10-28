"""
Research, Clinical Trials (IRB), and Medical Education Academic Logbook ORM models.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class IRBStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    MODIFICATIONS_REQUIRED = "modifications_required"
    REJECTED = "rejected"
    COMPLETED = "completed"


class ProcedureRole(str, enum.Enum):
    OBSERVER = "observer"
    ASSISTANT = "assistant"
    PRIMARY_OPERATOR = "primary_operator"


class IRBProtocol(Base):
    """Institutional Review Board (IRB) ethical research & clinical trial protocol."""
    __tablename__ = "irb_protocols"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protocol_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "IRB-MKH-2026-004"
    study_title: Mapped[str] = mapped_column(String(300), nullable=False)
    principal_investigator_name: Mapped[str] = mapped_column(String(150), nullable=False)
    pi_email: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)

    status: Mapped[IRBStatus] = mapped_column(
        Enum(IRBStatus, name="irb_status_enum", native_enum=False),
        default=IRBStatus.SUBMITTED,
        nullable=False,
    )
    approval_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    sample_size_target: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    enrolled_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class AcademicLogbook(Base):
    """Medical intern & resident clinical procedure training logbook."""
    __tablename__ = "academic_logbooks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trainee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)

    procedure_name: Mapped[str] = mapped_column(String(200), nullable=False) # e.g. "Endotracheal Intubation", "Lumbar Puncture"
    role: Mapped[ProcedureRole] = mapped_column(
        Enum(ProcedureRole, name="procedure_role_enum", native_enum=False),
        default=ProcedureRole.PRIMARY_OPERATOR,
        nullable=False,
    )
    performed_date: Mapped[date] = mapped_column(Date, nullable=False)

    supervisor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    supervisor_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
