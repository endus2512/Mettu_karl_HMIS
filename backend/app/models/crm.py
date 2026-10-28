"""
Patient Experience, CRM Feedback, and Grievance Redressal (SLA) ORM models.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class GrievanceCategory(str, enum.Enum):
    CLINICAL_CARE = "clinical_care"
    BILLING_FEES = "billing_fees"
    STAFF_CONDUCT = "staff_conduct"
    WAIT_TIME = "wait_time"
    FACILITY_CLEANLINESS = "facility_cleanliness"


class GrievancePriority(str, enum.Enum):
    LOW = "low"        # 7-day SLA
    MEDIUM = "medium"  # 3-day SLA
    HIGH = "high"      # 24-hr SLA
    CRITICAL = "critical" # 4-hr immediate clinical escalation


class GrievanceStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_INVESTIGATION = "under_investigation"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class PatientFeedback(Base):
    """Patient 5-star CSAT experience survey ratings."""
    __tablename__ = "patient_feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Pharmacy", "OPD", "Nursing"
    rating_stars: Mapped[int] = mapped_column(Integer, nullable=False) # 1 to 5
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class GrievanceTicket(Base):
    """Formal patient/family complaint ticket tracked with SLA deadlines."""
    __tablename__ = "grievance_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticket_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)

    complainant_name: Mapped[str] = mapped_column(String(150), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(25), nullable=False)
    category: Mapped[GrievanceCategory] = mapped_column(
        Enum(GrievanceCategory, name="grievance_category_enum", native_enum=False),
        nullable=False,
    )
    priority: Mapped[GrievancePriority] = mapped_column(
        Enum(GrievancePriority, name="grievance_priority_enum", native_enum=False),
        default=GrievancePriority.MEDIUM,
        nullable=False,
    )
    status: Mapped[GrievanceStatus] = mapped_column(
        Enum(GrievanceStatus, name="grievance_status_enum", native_enum=False),
        default=GrievanceStatus.SUBMITTED,
        nullable=False,
    )

    assigned_department: Mapped[str] = mapped_column(String(100), nullable=False)
    complaint_details: Mapped[str] = mapped_column(Text, nullable=False)
    resolution_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    sla_due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
