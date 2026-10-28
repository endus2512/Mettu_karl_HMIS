"""
Dietary, Hospital Kitchen, and Clinical Nutrition Order ORM models.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DietType(str, enum.Enum):
    REGULAR = "regular"
    DIABETIC = "diabetic"
    RENAL_LOW_SODIUM = "renal_low_sodium"
    SOFT_LIQUID = "soft_liquid"
    NPO_FASTING = "npo_fasting"          # Nothing by mouth
    HIGH_PROTEIN = "high_protein"


class MealType(str, enum.Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"


class DietOrderStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DISCONTINUED = "discontinued"


class DietOrder(Base):
    """Physician or nutritionist clinical dietary prescription for inpatient."""
    __tablename__ = "diet_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    diet_type: Mapped[DietType] = mapped_column(
        Enum(DietType, name="diet_type_enum", native_enum=False),
        nullable=False,
    )
    special_instructions: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # e.g. "Pureed, no added salt"
    allergies_noted: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    prescribed_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    status: Mapped[DietOrderStatus] = mapped_column(
        Enum(DietOrderStatus, name="diet_order_status_enum", native_enum=False),
        default=DietOrderStatus.ACTIVE,
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    deliveries: Mapped[list["KitchenMealDelivery"]] = relationship("KitchenMealDelivery", back_populates="diet_order")


class KitchenMealDelivery(Base):
    """Kitchen daily meal preparation and ward delivery verification."""
    __tablename__ = "kitchen_meal_deliveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    diet_order_id: Mapped[int] = mapped_column(ForeignKey("diet_orders.id", ondelete="CASCADE"), index=True)
    delivery_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    meal_type: Mapped[MealType] = mapped_column(
        Enum(MealType, name="meal_type_enum", native_enum=False),
        nullable=False,
    )
    ward_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bed_number: Mapped[str] = mapped_column(String(20), nullable=False)

    is_prepared: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_delivered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    diet_order: Mapped["DietOrder"] = relationship("DietOrder", back_populates="deliveries")
