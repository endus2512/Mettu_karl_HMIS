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
    call_sign: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # e.g. "AMB-01"
    vehicle_model: Mapped[str] = mapped_column(String(100), default="Toyota Land Cruiser HZJ78", nullable=False)
    vehicle_type: Mapped[Optional[str]] = mapped_column(String(100), default="advanced_life_support", nullable=True)
    is_als: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False) # Advanced Life Support equipped

    driver_name: Mapped[str] = mapped_column(String(100), default="EMS Standby Driver", nullable=False)
    driver_phone: Mapped[str] = mapped_column(String(20), default="+251911907907", nullable=False)
    assigned_crew: Mapped[Optional[str]] = mapped_column(String(200), default="Paramedic & EMT Team", nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Real-time GPS location & Telemetry
    current_lat: Mapped[Optional[float]] = mapped_column(Float, default=8.3000, nullable=True) # Mettu coordinates ~8.30, 35.58
    current_lon: Mapped[Optional[float]] = mapped_column(Float, default=35.5833, nullable=True)
    current_latitude: Mapped[Optional[float]] = mapped_column(Float, default=8.3000, nullable=True)
    current_longitude: Mapped[Optional[float]] = mapped_column(Float, default=35.5833, nullable=True)
    fuel_level_percent: Mapped[Optional[int]] = mapped_column(Integer, default=85, nullable=True)
    oxygen_tank_bar: Mapped[Optional[int]] = mapped_column(Integer, default=200, nullable=True)
    last_gps_update: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    calls: Mapped[list["EmergencyCall"]] = relationship("EmergencyCall", back_populates="ambulance")

    def __init__(self, **kwargs):
        if "current_latitude" in kwargs and "current_lat" not in kwargs:
            kwargs["current_lat"] = kwargs["current_latitude"]
        elif "current_lat" in kwargs and "current_latitude" not in kwargs:
            kwargs["current_latitude"] = kwargs["current_lat"]

        if "current_longitude" in kwargs and "current_lon" not in kwargs:
            kwargs["current_lon"] = kwargs["current_longitude"]
        elif "current_lon" in kwargs and "current_longitude" not in kwargs:
            kwargs["current_longitude"] = kwargs["current_lon"]

        if "call_sign" not in kwargs and "plate_number" in kwargs:
            kwargs["call_sign"] = kwargs["plate_number"]
        if "driver_name" not in kwargs:
            kwargs["driver_name"] = "Paramedic On Duty"
        if "driver_phone" not in kwargs:
            kwargs["driver_phone"] = "+251911907907"
        if "vehicle_model" not in kwargs and "vehicle_type" in kwargs:
            kwargs["vehicle_model"] = kwargs["vehicle_type"]
        super().__init__(**kwargs)


class EmergencyCall(Base):
    """907 emergency dispatch incident request."""
    __tablename__ = "emergency_calls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    incident_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    caller_name: Mapped[str] = mapped_column(String(100), default="Hotline 907 Caller", nullable=False)
    caller_phone: Mapped[str] = mapped_column(String(25), nullable=False)

    location_address: Mapped[str] = mapped_column(String(255), default="Mettu City Area", nullable=False) # e.g. "Sor Woreda, near bridge"
    incident_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    triage_level: Mapped[TriageLevel] = mapped_column(
        Enum(TriageLevel, name="ems_triage_level_enum", native_enum=False),
        default=TriageLevel.RED,
        nullable=False,
    )
    chief_complaint: Mapped[str] = mapped_column(String(255), default="Emergency trauma request", nullable=False)
    emergency_description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    status: Mapped[DispatchStatus] = mapped_column(
        Enum(DispatchStatus, name="dispatch_status_enum", native_enum=False),
        default=DispatchStatus.RECEIVED,
        nullable=False,
    )
    dispatch_status: Mapped[Optional[str]] = mapped_column(String(50), default="pending", nullable=True)
    ambulance_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ambulances.id", ondelete="SET NULL"), nullable=True)

    paramedic_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vital_signs_summary: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    arrived_hospital_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    ambulance: Mapped[Optional["Ambulance"]] = relationship("Ambulance", back_populates="calls")

    def __init__(self, **kwargs):
        if "incident_location" in kwargs and "location_address" not in kwargs:
            kwargs["location_address"] = kwargs["incident_location"]
        elif "location_address" in kwargs and "incident_location" not in kwargs:
            kwargs["incident_location"] = kwargs["location_address"]

        if "emergency_description" in kwargs and "chief_complaint" not in kwargs:
            kwargs["chief_complaint"] = kwargs["emergency_description"]
        elif "chief_complaint" in kwargs and "emergency_description" not in kwargs:
            kwargs["emergency_description"] = kwargs["chief_complaint"]

        if "caller_name" not in kwargs:
            kwargs["caller_name"] = "Emergency Hotline 907"
        if "dispatch_status" not in kwargs:
            kwargs["dispatch_status"] = "pending"
        super().__init__(**kwargs)
