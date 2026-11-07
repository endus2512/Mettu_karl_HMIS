"""
Laboratory Information System (LIS), Diagnostic Pathology & Blood Investigation ORM models.
Supports LOINC cataloging, doctor requisition orders, specimen phlebotomy accessioning,
quantitative/ordinal result verification, and critical panic value alerting.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LabCategory(str, enum.Enum):
    HEMATOLOGY = "hematology"                  # Dhiiga (CBC, Blood Film, Coagulation)
    CLINICAL_CHEMISTRY = "clinical_chemistry"  # Kemistirii (Glucose, LFT, RFT, Electrolytes)
    PARASITOLOGY_URINALYSIS = "parasitology_urinalysis" # Cawaa fi Fincaanii (Stool, Urine)
    SEROLOGY_IMMUNOLOGY = "serology_immunology"         # Jarmoota (HIV, HepB, Syphilis, Widal)
    MICROBIOLOGY = "microbiology"              # Baakteriyooloojii (Culture & Sensitivity)
    BLOOD_BANK = "blood_bank"                  # ABO/Rh Typing & Crossmatching


class SpecimenType(str, enum.Enum):
    WHOLE_BLOOD_EDTA = "whole_blood_edta"      # Lavender Top Tube
    SERUM_SST = "serum_sst"                    # Red / Gold SST Tube
    PLASMA_CITRATE = "plasma_citrate"          # Light Blue Top
    URINE_CLEAN_CATCH = "urine_clean_catch"    # Sterile Urine Cup
    STOOL_CUP = "stool_cup"                    # Stool Container
    SPUTUM = "sputum"                          # Sputum Cup
    CSF_STERILE = "csf_sterile"                # Lumbar Puncture CSF


class LabOrderStatus(str, enum.Enum):
    ORDERED = "ordered"                        # Doctor placed requisition
    SAMPLE_COLLECTED = "sample_collected"      # Phlebotomist drew specimen & generated barcode
    PROCESSING = "processing"                  # Sample in analyzer / under microscope
    COMPLETED = "completed"                    # Technologist verified results
    CANCELLED = "cancelled"                    # Cancelled by physician / rejected sample


class LabOrderPriority(str, enum.Enum):
    ROUTINE = "routine"                        # Standard turnaround (~60-120 mins)
    URGENT = "urgent"                          # Priority turnaround (~30-45 mins)
    STAT = "stat"                              # Immediate emergency life-critical (~15 mins)


class ResultFlag(str, enum.Enum):
    NORMAL = "normal"
    LOW = "low"
    HIGH = "high"
    CRITICAL_PANIC = "critical_panic"          # Requires immediate doctor notification


class LabTestCatalog(Base):
    """Master diagnostic test catalog and LOINC standardized directory."""
    __tablename__ = "lab_test_catalog"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    test_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    test_name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    name_om: Mapped[Optional[str]] = mapped_column(String(200), nullable=True) # Afaan Oromoo
    category: Mapped[LabCategory] = mapped_column(
        Enum(LabCategory, name="lab_category_enum", native_enum=False),
        index=True,
        nullable=False,
    )
    specimen_type: Mapped[SpecimenType] = mapped_column(
        Enum(SpecimenType, name="specimen_type_enum", native_enum=False),
        nullable=False,
    )
    tube_color: Mapped[str] = mapped_column(String(60), default="Lavender / Purple Top", nullable=False)
    loinc_code: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    price_etb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    turnaround_time_mins: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    parameters_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    order_items: Mapped[list["LabOrderItem"]] = relationship("LabOrderItem", back_populates="test")


class LabOrder(Base):
    """Physician laboratory investigation order."""
    __tablename__ = "lab_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True, nullable=False)
    ordering_doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    priority: Mapped[LabOrderPriority] = mapped_column(
        Enum(LabOrderPriority, name="lab_order_priority_enum", native_enum=False),
        default=LabOrderPriority.ROUTINE,
        index=True,
        nullable=False,
    )
    clinical_notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[LabOrderStatus] = mapped_column(
        Enum(LabOrderStatus, name="lab_order_status_enum", native_enum=False),
        default=LabOrderStatus.ORDERED,
        index=True,
        nullable=False,
    )

    ordered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Specimen collection & accessioning
    sample_collected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sample_collector_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sample_barcode: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    sample_rejection_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Result verification & completion
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    has_critical_flag: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    billing_invoice_id: Mapped[Optional[int]] = mapped_column(ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient")
    ordering_doctor: Mapped["User"] = relationship("User", foreign_keys=[ordering_doctor_id])
    sample_collector: Mapped[Optional["User"]] = relationship("User", foreign_keys=[sample_collector_id])
    verified_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by_id])
    items: Mapped[list["LabOrderItem"]] = relationship("LabOrderItem", back_populates="order", cascade="all, delete-orphan")
    results: Mapped[list["LabResult"]] = relationship("LabResult", back_populates="order", cascade="all, delete-orphan")


class LabOrderItem(Base):
    """Specific test item included within a lab order."""
    __tablename__ = "lab_order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lab_order_id: Mapped[int] = mapped_column(ForeignKey("lab_orders.id", ondelete="CASCADE"), index=True, nullable=False)
    test_catalog_id: Mapped[int] = mapped_column(ForeignKey("lab_test_catalog.id", ondelete="RESTRICT"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ordered", nullable=False)

    order: Mapped["LabOrder"] = relationship("LabOrder", back_populates="items")
    test: Mapped["LabTestCatalog"] = relationship("LabTestCatalog", back_populates="order_items")


class LabResult(Base):
    """Quantitative or qualitative laboratory test result parameter."""
    __tablename__ = "lab_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lab_order_id: Mapped[int] = mapped_column(ForeignKey("lab_orders.id", ondelete="CASCADE"), index=True, nullable=False)
    test_catalog_id: Mapped[int] = mapped_column(ForeignKey("lab_test_catalog.id", ondelete="RESTRICT"), nullable=False)

    parameter_name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    result_value: Mapped[str] = mapped_column(String(100), nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reference_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    flag: Mapped[ResultFlag] = mapped_column(
        Enum(ResultFlag, name="lab_result_flag_enum", native_enum=False),
        default=ResultFlag.NORMAL,
        index=True,
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    technologist_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    order: Mapped["LabOrder"] = relationship("LabOrder", back_populates="results")
    test: Mapped["LabTestCatalog"] = relationship("LabTestCatalog")
    technologist: Mapped[Optional["User"]] = relationship("User", foreign_keys=[technologist_id])
