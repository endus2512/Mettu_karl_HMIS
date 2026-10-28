"""
Queue Management and Smart Token System ORM models.
Powering waiting room live TV dashboard displays and ticket routing.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TicketStatus(str, enum.Enum):
    WAITING = "waiting"
    CALLED = "called"
    IN_SERVICE = "in_service"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class TicketPriority(str, enum.Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    EMERGENCY = "emergency"


class QueueDepartment(Base):
    """Clinical or administrative department with queue routing."""
    __tablename__ = "queue_departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)  # e.g., "OPD_1", "LAB", "PHARM"
    token_prefix: Mapped[str] = mapped_column(String(5), default="A", nullable=False)
    counter_name: Mapped[str] = mapped_column(String(50), default="Room 1", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    tickets: Mapped[list["QueueTicket"]] = relationship("QueueTicket", back_populates="department")


class QueueTicket(Base):
    """Queue token ticket issued to a patient upon arrival."""
    __tablename__ = "queue_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticket_number: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # e.g., "A-104"
    department_id: Mapped[int] = mapped_column(ForeignKey("queue_departments.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)

    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="ticket_status_enum", native_enum=False),
        default=TicketStatus.WAITING,
        index=True,
        nullable=False,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        Enum(TicketPriority, name="ticket_priority_enum", native_enum=False),
        default=TicketPriority.ROUTINE,
        nullable=False,
    )

    room_counter: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "OPD Room 3"
    called_by_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    called_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    department: Mapped["QueueDepartment"] = relationship("QueueDepartment", back_populates="tickets")
