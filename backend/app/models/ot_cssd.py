"""
Operation Theatre (OT) & Central Sterile Services Department (CSSD) ORM models.
Manages surgical table scheduling, clinical team allocation, autoclave batches, and sterile sets.
"""
from datetime import datetime, timezone
import enum
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SurgeryStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PREP = "in_prep"
    IN_SURGERY = "in_surgery"
    IN_RECOVERY = "in_recovery"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SterilizerType(str, enum.Enum):
    STEAM_AUTOCLAVE = "steam_autoclave"
    CHEMICAL_GAS = "chemical_gas"
    HYDROGEN_PEROXIDE_PLASMA = "plasma"


class SterilePackStatus(str, enum.Enum):
    STERILE = "sterile"
    USED = "used"
    EXPIRED = "expired"
    CONTAMINATED = "contaminated"


class OperatingRoom(Base):
    """Surgical operating theatre suites."""
    __tablename__ = "operating_rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False) # e.g. "OT Suite 1 (Major Surgery)"
    room_code: Mapped[str] = mapped_column(String(20), default="OT-1", nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), default="General Surgery", nullable=False)
    floor_location: Mapped[str] = mapped_column(String(50), default="Block B - 2nd Floor", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    bookings: Mapped[List["SurgicalBooking"]] = relationship("SurgicalBooking", back_populates="room")


class SurgicalBooking(Base):
    """Operation theatre booking linked to patient and surgical team."""
    __tablename__ = "surgical_bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    booking_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("operating_rooms.id", ondelete="RESTRICT"), index=True)

    procedure_name: Mapped[str] = mapped_column(String(255), nullable=False) # e.g., "Emergency Appendectomy"
    lead_surgeon_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    anesthesiologist_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scrub_nurse_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)

    status: Mapped[SurgeryStatus] = mapped_column(
        Enum(SurgeryStatus, name="surgery_status_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=SurgeryStatus.SCHEDULED,
        index=True,
        nullable=False,
    )

    who_safety_checklist_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    post_op_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    blood_loss_ml: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    findings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    implants_used: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    room: Mapped["OperatingRoom"] = relationship("OperatingRoom", back_populates="bookings")
    patient: Mapped["Patient"] = relationship("Patient", foreign_keys=[patient_id])
    lead_surgeon: Mapped["User"] = relationship("User", foreign_keys=[lead_surgeon_id])
    anesthesiologist: Mapped[Optional["User"]] = relationship("User", foreign_keys=[anesthesiologist_id])
    scrub_nurse: Mapped[Optional["User"]] = relationship("User", foreign_keys=[scrub_nurse_id])


class CSSDBatch(Base):
    """Central Sterile Services Department (CSSD) autoclave sterilization cycle."""
    __tablename__ = "cssd_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    sterilizer_type: Mapped[SterilizerType] = mapped_column(
        Enum(SterilizerType, name="sterilizer_type_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=SterilizerType.STEAM_AUTOCLAVE,
        nullable=False,
    )
    sterilizer_unit_name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Tuttnauer 5075 Autoclave"

    temperature_celsius: Mapped[float] = mapped_column(Float, default=134.0, nullable=False)
    pressure_bar: Mapped[float] = mapped_column(Float, default=2.2, nullable=False)
    cycle_duration_min: Mapped[int] = mapped_column(Integer, default=45, nullable=False)

    biological_indicator_passed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sterilized_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    packs: Mapped[List["SterilePack"]] = relationship("SterilePack", back_populates="batch", cascade="all, delete-orphan")
    operator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[operator_id])


class SterilePack(Base):
    """Individual surgical instrument pack tracked from sterilization to OT table."""
    __tablename__ = "sterile_packs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pack_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    batch_id: Mapped[int] = mapped_column(ForeignKey("cssd_batches.id", ondelete="CASCADE"), index=True)

    pack_name: Mapped[str] = mapped_column(String(150), nullable=False) # e.g. "Caesarean Section Instrument Set"
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    status: Mapped[SterilePackStatus] = mapped_column(
        Enum(SterilePackStatus, name="sterile_pack_status_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=SterilePackStatus.STERILE,
        nullable=False,
    )

    batch: Mapped["CSSDBatch"] = relationship("CSSDBatch", back_populates="packs")
