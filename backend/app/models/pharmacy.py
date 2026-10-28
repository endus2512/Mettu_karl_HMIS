"""
Pharmacy, Inventory, Batch Tracking, and FEFO Stock Movement ORM models.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DosageForm(str, enum.Enum):
    TABLET = "tablet"
    CAPSULE = "capsule"
    SYRUP = "syrup"
    INJECTION = "injection"
    OINTMENT = "ointment"
    DROPS = "drops"
    INHALER = "inhaler"


class PrescriptionStatus(str, enum.Enum):
    PENDING = "pending"
    DISPENSED = "dispensed"
    PARTIALLY_DISPENSED = "partially_dispensed"
    CANCELLED = "cancelled"


class MovementType(str, enum.Enum):
    RECEIVE = "receive"
    DISPENSE = "dispense"
    RETURN = "return"
    ADJUSTMENT = "adjustment"
    EXPIRED_DISPOSAL = "expired_disposal"


class Drug(Base):
    """Pharmaceutical product master item."""
    __tablename__ = "drugs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    generic_name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    dosage_form: Mapped[DosageForm] = mapped_column(
        Enum(DosageForm, name="dosage_form_enum", native_enum=False),
        nullable=False,
    )
    strength: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "500mg", "100mg/5ml"
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    reorder_level: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    batches: Mapped[list["DrugBatch"]] = relationship("DrugBatch", back_populates="drug", cascade="all, delete-orphan")


class DrugBatch(Base):
    """Specific stock batch with manufacture & expiry tracking for FEFO fulfillment."""
    __tablename__ = "drug_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    drug_id: Mapped[int] = mapped_column(ForeignKey("drugs.id", ondelete="CASCADE"), index=True)
    batch_number: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    manufacture_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    initial_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    current_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    drug: Mapped["Drug"] = relationship("Drug", back_populates="batches")


class Prescription(Base):
    """Physician medication order for a patient."""
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prescription_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), index=True)
    prescriber_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    status: Mapped[PrescriptionStatus] = mapped_column(
        Enum(PrescriptionStatus, name="prescription_status_enum", native_enum=False),
        default=PrescriptionStatus.PENDING,
        nullable=False,
    )
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    dispensed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    items: Mapped[list["PrescriptionItem"]] = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")


class PrescriptionItem(Base):
    """Individual drug item within a prescription."""
    __tablename__ = "prescription_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prescription_id: Mapped[int] = mapped_column(ForeignKey("prescriptions.id", ondelete="CASCADE"), index=True)
    drug_id: Mapped[int] = mapped_column(ForeignKey("drugs.id", ondelete="RESTRICT"), index=True)
    batch_id: Mapped[Optional[int]] = mapped_column(ForeignKey("drug_batches.id", ondelete="SET NULL"), nullable=True)

    dosage: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "1 tablet"
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "Three times daily (TID)"
    duration_days: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    quantity_prescribed: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_dispensed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    instructions: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="items")
    drug: Mapped["Drug"] = relationship("Drug")


class StockMovement(Base):
    """Audit ledger for every stock change in the hospital pharmacy."""
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    drug_id: Mapped[int] = mapped_column(ForeignKey("drugs.id", ondelete="CASCADE"), index=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("drug_batches.id", ondelete="CASCADE"), index=True)
    movement_type: Mapped[MovementType] = mapped_column(
        Enum(MovementType, name="movement_type_enum", native_enum=False),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)  # positive or negative
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., Prescription Code or PO #
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
