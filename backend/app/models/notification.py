"""
Notifications and SMS Reminder logs ORM models.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import DateTime, Enum, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class NotificationChannel(str, enum.Enum):
    SMS = "sms"
    PUSH = "push"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class SMSProvider(str, enum.Enum):
    ETHIO_TELECOM = "ethio_telecom"
    TWILIO = "twilio"
    AFRICASTALKING = "africastalking"
    ANDROID_GATEWAY = "android_gateway"
    SIMULATED = "simulated"


class SMSGatewayConfig(Base):
    """Dynamic configuration for hospital SMS telecom carrier gateways."""
    __tablename__ = "sms_gateway_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider: Mapped[str] = mapped_column(String(50), default="simulated", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Ethio Telecom fields
    ethio_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ethio_username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ethio_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ethio_shortcode: Mapped[Optional[str]] = mapped_column(String(20), default="907", nullable=True)

    # Twilio fields
    twilio_account_sid: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    twilio_auth_token: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    twilio_from_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Android GSM Gateway / Local HTTP Modem
    android_gateway_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    android_gateway_token: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Africa's Talking
    africastalking_username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    africastalking_api_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    africastalking_sender_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SMSNotificationLog(Base):
    """SMS reminder dispatch audit trail."""
    __tablename__ = "sms_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recipient_phone: Mapped[str] = mapped_column(String(25), index=True, nullable=False)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(5), default="om", nullable=False)  # "om", "am", "en"
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="notification_channel_enum", native_enum=False),
        default=NotificationChannel.SMS,
        nullable=False,
    )
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus, name="notification_status_enum", native_enum=False),
        default=NotificationStatus.PENDING,
        nullable=False,
    )
    error_message: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class ClinicalNotification(Base):
    """
    Hospital-wide clinical event & in-app notification model.
    Powers real-time WebSocket alerts, emergency broadcasts (Code Blue),
    critical lab panic values, IoMT bedside breaches, and staff reactions.
    """
    __tablename__ = "clinical_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="info", nullable=False)  # "info", "warning", "critical", "emergency"
    category: Mapped[str] = mapped_column(String(50), default="broadcast", nullable=False)  # "code_blue", "lab_panic", "urgent_rx", "triage_red", "iomt_alarm", "mci_alert", "directive", "broadcast"
    
    sender_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sender_name: Mapped[str] = mapped_column(String(100), default="Hospital Executive Administration", nullable=False)
    sender_role: Mapped[str] = mapped_column(String(50), default="admin", nullable=False)
    
    target_role: Mapped[str] = mapped_column(String(50), default="all", index=True, nullable=False)  # "all", "doctor", "nurse", "pharmacist", "technician", "billing", "admin", "patient"
    target_user_id: Mapped[Optional[int]] = mapped_column(Integer, index=True, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string for clinical context (e.g. {mrn, bed, vital, test})
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # 1-click clinical reaction (e.g., "On My Way", "At Bedside", "Dispensed", "Acknowledged")
    reaction_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reaction_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reaction_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reacted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

