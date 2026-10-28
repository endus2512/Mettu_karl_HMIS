"""
Ambulance Fleet, Emergency 907 Dispatch, and Field Triage (EMS) ORM models.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TriageLevel(str, enum.Enum):
    RED = "red"        # Immediate / Life Threatening (Cardiac, severe trauma, hypoxia)
    YELLOW = "yellow"  # Urgent (Stable fractures, moderate burns)
    GREEN = "green"    # Delayed / Minor ambulatory
    BLACK = "black"    # Expectant / Deceased


class DispatchStatus(str, enum.Enum):
    RECEIVED = "received"
    DISPATCHED = "dispatched"
    EN_ROUTE = "en_route"
    ON_SCENE = "on_scene"
    PATIENT_LOADED = "patient_loaded"
    ARRIVED_HOSPITAL = "arrived_hospital"
    CANCELLED = "cancelled"


class Ambulance(Base):
    """Emergency response vehicle fleet."""
    __tablename__ = "ambulances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plate_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "ET-3-04921"
    vehicle_model: Mapped[str] = mapped_column(String(100), default="Toyota Land Cruiser HZJ78", nullable=False)
    is_als: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False) # Advanced Life Support equipped

    driver_name: Mapped[str] = mapped_column(String(100), nullable=False)
    driver_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Real-time GPS location
    current_lat: Mapped[Optional[float]] = mapped_column(Float, default=8.3000, nullable=True) # Mettu coordinates ~8.30, 35.58
    current_lon: Mapped[Optional[float]] = mapped_column(Float, default=35.5833, nullable=True)
    last_gps_update: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    calls: Mapped[list["EmergencyCall"]] = relationship("EmergencyCall", back_populates="ambulance")


class EmergencyCall(Base):
    """907 emergency dispatch incident request."""
    __tablename__ = "emergency_calls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    incident_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    caller_name: Mapped[str] = mapped_column(String(100), nullable=False)
    caller_phone: Mapped[str] = mapped_column(String(25), nullable=False)

    location_address: Mapped[str] = mapped_column(String(255), nullable=False) # e.g. "Sor Woreda, near bridge"
    location_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    triage_level: Mapped[TriageLevel] = mapped_column(
        Enum(TriageLevel, name="ems_triage_level_enum", native_enum=False),
        default=TriageLevel.RED,
        nullable=False,
    )
    chief_complaint: Mapped[str] = mapped_column(String(255), nullable=False) # e.g. "Road traffic accident with unconscious driver"

    status: Mapped[DispatchStatus] = mapped_column(
        Enum(DispatchStatus, name="dispatch_status_enum", native_enum=False),
        default=DispatchStatus.RECEIVED,
        nullable=False,
    )
    ambulance_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ambulances.id", ondelete="SET NULL"), nullable=True)

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    arrived_hospital_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    ambulance: Mapped[Optional["Ambulance"]] = relationship("Ambulance", back_populates="calls")
