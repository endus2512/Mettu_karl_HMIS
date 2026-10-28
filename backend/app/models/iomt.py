"""
Internet of Medical Things (IoMT) & Bedside Device Telemetry ORM models.
Receives real-time streams of patient vitals (Heart rate, SpO2, NIBP, Temperature).
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DeviceType(str, enum.Enum):
    BEDSIDE_MONITOR = "bedside_monitor"
    PULSE_OXIMETER = "pulse_oximeter"
    ECG_TELEMETRY = "ecg_telemetry"
    SMART_INFUSION_PUMP = "infusion_pump"


class AlarmSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class IoMTDevice(Base):
    """Connected medical device streaming real-time telemetry."""
    __tablename__ = "iomt_devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_uid: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False) # e.g. "MON-ICU-BED04"
    name: Mapped[str] = mapped_column(String(150), nullable=False) # e.g. "Mindray BeneVision N12"
    device_type: Mapped[DeviceType] = mapped_column(
        Enum(DeviceType, name="device_type_enum", native_enum=False),
        nullable=False,
    )

    ward: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Intensive Care Unit"
    bed_number: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "Bed 04"
    current_patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)

    is_online: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_ping: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    telemetry_logs: Mapped[list["VitalTelemetry"]] = relationship("VitalTelemetry", back_populates="device")


class VitalTelemetry(Base):
    """High-frequency continuous vital sign measurement datapoint."""
    __tablename__ = "vital_telemetries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("iomt_devices.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)

    heart_rate_bpm: Mapped[int] = mapped_column(Integer, nullable=False)
    spo2_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    systolic_bp_mmhg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    diastolic_bp_mmhg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    respiratory_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    temperature_celsius: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    device: Mapped["IoMTDevice"] = relationship("IoMTDevice", back_populates="telemetry_logs")


class TelemetryAlarm(Base):
    """Automated clinical threshold alarm (e.g. SpO2 < 90% or Tachycardia > 130 BPM)."""
    __tablename__ = "telemetry_alarms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("iomt_devices.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)

    alarm_title: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Severe Hypoxia Detected"
    severity: Mapped[AlarmSeverity] = mapped_column(
        Enum(AlarmSeverity, name="alarm_severity_enum", native_enum=False),
        default=AlarmSeverity.CRITICAL,
        nullable=False,
    )
    metric_value: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "SpO2 = 84%"

    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    acknowledged_by_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
