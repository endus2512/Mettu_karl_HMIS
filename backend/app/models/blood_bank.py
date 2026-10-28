"""
Blood Bank, Donors, Component Inventory, and Cross-Matching ORM models.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BloodGroup(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class ComponentType(str, enum.Enum):
    WHOLE_BLOOD = "whole_blood"
    PACKED_RBC = "packed_rbc"        # 35-42 days shelf life
    FRESH_FROZEN_PLASMA = "ffp"      # 1 year frozen (-25°C)
    PLATELETS = "platelets"          # 5 days shelf life (20-24°C)
    CRYOPRECIPITATE = "cryo"


class BloodUnitStatus(str, enum.Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    TRANSFUSED = "transfused"
    EXPIRED = "expired"
    QUARANTINED = "quarantined"


class BloodDonor(Base):
    """Voluntary and replacement blood donor registry."""
    __tablename__ = "blood_donors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    donor_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    blood_group: Mapped[BloodGroup] = mapped_column(
        Enum(BloodGroup, name="donor_blood_group_enum", native_enum=False),
        nullable=False,
    )
    last_donation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    total_donations_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_eligible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    units: Mapped[list["BloodUnit"]] = relationship("BloodUnit", back_populates="donor")


class BloodUnit(Base):
    """Individual screened blood unit stored in monitored cold chain refrigerators."""
    __tablename__ = "blood_units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    unit_barcode: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    donor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("blood_donors.id", ondelete="SET NULL"), nullable=True)

    blood_group: Mapped[BloodGroup] = mapped_column(
        Enum(BloodGroup, name="unit_blood_group_enum", native_enum=False),
        index=True,
        nullable=False,
    )
    component_type: Mapped[ComponentType] = mapped_column(
        Enum(ComponentType, name="component_type_enum", native_enum=False),
        nullable=False,
    )
    volume_ml: Mapped[int] = mapped_column(Integer, default=450, nullable=False)

    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)

    storage_temperature_celsius: Mapped[float] = mapped_column(Float, default=4.0, nullable=False)
    status: Mapped[BloodUnitStatus] = mapped_column(
        Enum(BloodUnitStatus, name="blood_unit_status_enum", native_enum=False),
        default=BloodUnitStatus.AVAILABLE,
        index=True,
        nullable=False,
    )

    donor: Mapped[Optional["BloodDonor"]] = relationship("BloodDonor", back_populates="units")


class CrossMatch(Base):
    """Compatibility testing between patient serum and donor blood unit."""
    __tablename__ = "blood_crossmatches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    blood_unit_id: Mapped[int] = mapped_column(ForeignKey("blood_units.id", ondelete="RESTRICT"), index=True)

    is_compatible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    tested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    technologist_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
