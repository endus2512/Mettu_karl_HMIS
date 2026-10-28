"""
Notifications and SMS Reminder logs ORM models.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class NotificationChannel(str, enum.Enum):
    SMS = "sms"
    PUSH = "push"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


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
