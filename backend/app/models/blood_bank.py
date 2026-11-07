"""
Blood Bank, Donors, Component Inventory, and Cross-Matching ORM models.
Mettu Karl Comprehensive Specialized Hospital — Cold Chain & Hemovigilance Standards.
"""
from datetime import date, datetime, timezone
import enum
from typing import List, Optional

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
    PRBC = "packed_rbc"              # Alias for PACKED_RBC
    FRESH_FROZEN_PLASMA = "ffp"      # 1 year frozen (-25°C)
    FFP = "ffp"                      # Alias for FFP
    PLATELETS = "platelets"          # 5 days shelf life (20-24°C)
    CRYOPRECIPITATE = "cryo"
    CRYO = "cryo"                    # Alias for CRYO


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

    units: Mapped[List["BloodUnit"]] = relationship("BloodUnit", back_populates="donor")


class BloodUnit(Base):
    """Individual screened blood unit stored in monitored cold chain refrigerators."""
    __tablename__ = "blood_units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    unit_barcode: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    unit_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
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
    storage_location: Mapped[str] = mapped_column(String(100), default="Walk-In Blood Refrigerator #1", nullable=False)
    status: Mapped[BloodUnitStatus] = mapped_column(
        Enum(BloodUnitStatus, name="blood_unit_status_enum", native_enum=False),
        default=BloodUnitStatus.AVAILABLE,
        index=True,
        nullable=False,
    )

    tested_negative_hiv: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tested_negative_hep_b: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tested_negative_hep_c: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tested_negative_syphilis: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    donor: Mapped[Optional["BloodDonor"]] = relationship("BloodDonor", back_populates="units")

    def __init__(self, **kwargs):
        # Support unit_number alias for unit_barcode
        if "unit_number" in kwargs and "unit_barcode" not in kwargs:
            kwargs["unit_barcode"] = kwargs["unit_number"]
        elif "unit_barcode" in kwargs and "unit_number" not in kwargs:
            kwargs["unit_number"] = kwargs["unit_barcode"]

        # Support collected_date alias for collected_at
        if "collected_date" in kwargs and "collected_at" not in kwargs:
            cdate = kwargs.pop("collected_date")
            if isinstance(cdate, str):
                kwargs["collected_at"] = datetime.fromisoformat(cdate).replace(tzinfo=timezone.utc)
            elif isinstance(cdate, date) and not isinstance(cdate, datetime):
                kwargs["collected_at"] = datetime.combine(cdate, datetime.min.time(), tzinfo=timezone.utc)
            else:
                kwargs["collected_at"] = cdate

        if "expiry_date" in kwargs:
            edate = kwargs["expiry_date"]
            if isinstance(edate, str):
                kwargs["expiry_date"] = datetime.fromisoformat(edate).replace(tzinfo=timezone.utc)
            elif isinstance(edate, date) and not isinstance(edate, datetime):
                kwargs["expiry_date"] = datetime.combine(edate, datetime.min.time(), tzinfo=timezone.utc)

        super().__init__(**kwargs)


class CrossMatch(Base):
    """Compatibility testing between patient serum and donor blood unit."""
    __tablename__ = "blood_crossmatches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    crossmatch_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    blood_unit_id: Mapped[int] = mapped_column(ForeignKey("blood_units.id", ondelete="RESTRICT"), index=True)
    patient_blood_group: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    is_compatible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    crossmatch_method: Mapped[str] = mapped_column(String(100), default="Indirect Antiglobulin Test (IAT)", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="compatible", nullable=False)

    tested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    technologist_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", foreign_keys=[patient_id])
    blood_unit: Mapped["BloodUnit"] = relationship("BloodUnit", foreign_keys=[blood_unit_id])
    technologist: Mapped["User"] = relationship("User", foreign_keys=[technologist_id])
