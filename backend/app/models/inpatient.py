"""
Inpatient Department (IPD), Ward & Bed Occupancy Management ORM Models.
Supports clinical ward classification, real-time bed census tracking,
patient admissions, bed transfers, and clinical discharge clearance.
"""
from datetime import datetime, timezone
import enum
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BedStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"


class BedType(str, enum.Enum):
    STANDARD = "standard"
    ICU_VENTILATED = "icu_ventilated"
    PEDIATRIC_CRIB = "pediatric_crib"
    ISOLATION_NEGATIVE_PRESSURE = "isolation_negative_pressure"
    DELIVERY_BED = "delivery_bed"


class AdmissionStatus(str, enum.Enum):
    ADMITTED = "admitted"
    TRANSFERRED = "transferred"
    DISCHARGED = "discharged"
    DECEASED = "deceased"


class AcuityLevel(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MODERATE = "moderate"
    STABLE = "stable"


class Ward(Base):
    """
    Hospital Inpatient Clinical Ward / Department entity.
    """
    __tablename__ = "wards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ward_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    name_om: Mapped[str] = mapped_column(String(100), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    floor_location: Mapped[str] = mapped_column(String(50), nullable=False)
    head_nurse: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    beds: Mapped[List["WardBed"]] = relationship(
        "WardBed",
        back_populates="ward",
        cascade="all, delete-orphan",
        foreign_keys="WardBed.ward_id",
    )


class WardBed(Base):
    """
    Individual patient bed inside a hospital ward.
    Tracks physical occupancy, utility capabilities (O2, telemetry), and daily rates.
    """
    __tablename__ = "ward_beds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ward_id: Mapped[int] = mapped_column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False, index=True)
    bed_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    bed_type: Mapped[str] = mapped_column(String(50), default="standard", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="available", nullable=False)
    daily_rate_etb: Mapped[float] = mapped_column(Float, default=150.0, nullable=False)
    oxygen_supplied: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    has_monitor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    current_admission_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("inpatient_admissions.id", ondelete="SET NULL", use_alter=True, name="fk_ward_bed_current_admission"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    ward: Mapped["Ward"] = relationship("Ward", back_populates="beds", foreign_keys=[ward_id])
    current_admission: Mapped[Optional["InpatientAdmission"]] = relationship(
        "InpatientAdmission",
        foreign_keys=[current_admission_id],
        post_update=True,
    )


class InpatientAdmission(Base):
    """
    Inpatient clinical admission record.
    Links patient to a specific ward, bed, attending clinician, diagnosis, and billing.
    """
    __tablename__ = "inpatient_admissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    admission_number: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    ward_id: Mapped[int] = mapped_column(Integer, ForeignKey("wards.id"), nullable=False, index=True)
    bed_id: Mapped[int] = mapped_column(Integer, ForeignKey("ward_beds.id"), nullable=False, index=True)
    admitting_doctor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    primary_nurse_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    # Clinical indications
    admitting_diagnosis: Mapped[str] = mapped_column(String(255), nullable=False)
    icd10_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    admission_type: Mapped[str] = mapped_column(String(50), default="emergency", nullable=False)
    acuity_level: Mapped[str] = mapped_column(String(20), default="moderate", nullable=False)
    diet_category: Mapped[str] = mapped_column(String(50), default="regular", nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), default="cash", nullable=False)

    # Stay Timeline
    admission_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    discharge_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    discharge_doctor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    discharge_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    discharge_condition: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Accounting & Stay duration
    total_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_bed_charge_etb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="admitted", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", foreign_keys=[patient_id])
    ward: Mapped["Ward"] = relationship("Ward", foreign_keys=[ward_id])
    bed: Mapped["WardBed"] = relationship("WardBed", foreign_keys=[bed_id])
    admitting_doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[admitting_doctor_id])
    discharge_doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[discharge_doctor_id])
    primary_nurse: Mapped[Optional["User"]] = relationship("User", foreign_keys=[primary_nurse_id])
    transfer_logs: Mapped[List["BedTransferLog"]] = relationship(
        "BedTransferLog",
        back_populates="admission",
        cascade="all, delete-orphan",
    )


class BedTransferLog(Base):
    """
    Audit log of patient transfers between hospital beds and wards.
    """
    __tablename__ = "bed_transfer_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    admission_id: Mapped[int] = mapped_column(Integer, ForeignKey("inpatient_admissions.id", ondelete="CASCADE"), nullable=False, index=True)
    from_ward_id: Mapped[int] = mapped_column(Integer, ForeignKey("wards.id"), nullable=False)
    from_bed_id: Mapped[int] = mapped_column(Integer, ForeignKey("ward_beds.id"), nullable=False)
    to_ward_id: Mapped[int] = mapped_column(Integer, ForeignKey("wards.id"), nullable=False)
    to_bed_id: Mapped[int] = mapped_column(Integer, ForeignKey("ward_beds.id"), nullable=False)
    transferred_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    transfer_reason: Mapped[str] = mapped_column(String(255), nullable=False)
    transferred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    admission: Mapped["InpatientAdmission"] = relationship("InpatientAdmission", back_populates="transfer_logs", foreign_keys=[admission_id])
    from_ward: Mapped["Ward"] = relationship("Ward", foreign_keys=[from_ward_id])
    from_bed: Mapped["WardBed"] = relationship("WardBed", foreign_keys=[from_bed_id])
    to_ward: Mapped["Ward"] = relationship("Ward", foreign_keys=[to_ward_id])
    to_bed: Mapped["WardBed"] = relationship("WardBed", foreign_keys=[to_bed_id])
    transferred_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[transferred_by_id])
