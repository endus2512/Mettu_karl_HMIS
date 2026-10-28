"""
Biomedical Equipment & Hospital Asset Management ORM models.
Tracks medical equipment registry, PPM schedules, calibrations, and breakdown work orders.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AssetCategory(str, enum.Enum):
    LIFE_SUPPORT = "life_support"      # Ventilators, Defibrillators, Anesthesia
    DIAGNOSTIC = "diagnostic"          # Ultrasound, ECG, X-Ray, CT
    THERAPEUTIC = "therapeutic"        # Dialysis, Infusion pumps
    LABORATORY = "laboratory"          # Centrifuges, Analyzers
    SURGICAL = "surgical"              # Electrocautery, Laparoscopy towers
    FACILITY = "facility"              # Autoclaves, Oxygen plants, Generators


class AssetStatus(str, enum.Enum):
    OPERATIONAL = "operational"
    MAINTENANCE_REQUIRED = "maintenance_required"
    OUT_OF_SERVICE = "out_of_service"
    DECOMMISSIONED = "decommissioned"


class MaintenanceType(str, enum.Enum):
    PREVENTIVE = "preventive"
    CORRECTIVE = "corrective"
    CALIBRATION = "calibration"


class MaintenanceStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BiomedicalAsset(Base):
    """Hospital biomedical device and capital equipment record."""
    __tablename__ = "biomedical_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_tag: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "VENT-004"
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    category: Mapped[AssetCategory] = mapped_column(
        Enum(AssetCategory, name="asset_category_enum", native_enum=False),
        nullable=False,
    )
    status: Mapped[AssetStatus] = mapped_column(
        Enum(AssetStatus, name="asset_status_enum", native_enum=False),
        default=AssetStatus.OPERATIONAL,
        index=True,
        nullable=False,
    )

    # Location
    department: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    room_number: Mapped[str] = mapped_column(String(50), nullable=False)

    # Acquisition & PPM
    purchase_price_etb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    installation_date: Mapped[date] = mapped_column(Date, nullable=False)
    warranty_expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Maintenance cycle
    ppm_interval_days: Mapped[int] = mapped_column(Integer, default=90, nullable=False) # e.g. Quarterly
    last_ppm_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_ppm_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)

    work_orders: Mapped[list["MaintenanceOrder"]] = relationship("MaintenanceOrder", back_populates="asset")


class MaintenanceOrder(Base):
    """Corrective breakdown or scheduled PPM service work order."""
    __tablename__ = "maintenance_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    work_order_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    asset_id: Mapped[int] = mapped_column(ForeignKey("biomedical_assets.id", ondelete="CASCADE"), index=True)

    maintenance_type: Mapped[MaintenanceType] = mapped_column(
        Enum(MaintenanceType, name="maintenance_type_enum", native_enum=False),
        nullable=False,
    )
    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus, name="maintenance_status_enum", native_enum=False),
        default=MaintenanceStatus.SCHEDULED,
        nullable=False,
    )

    issue_description: Mapped[str] = mapped_column(Text, nullable=False)
    action_taken: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_engineer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cost_etb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    asset: Mapped["BiomedicalAsset"] = relationship("BiomedicalAsset", back_populates="work_orders")
