"""
National Digital ID (Fayda / Ethiopian FIN) ORM models.
Facilitates patient identity verification, eKYC validation, and linking Fayda to FHIR Patient records.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FaydaVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class FaydaRecord(Base):
    """Fayda National Digital ID record linked to hospital patient registry."""
    __tablename__ = "fayda_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), unique=True, index=True)
    
    fin_number: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False) # Fayda Identification Number e.g. "FAN-9901-2384-5120"
    full_name_am: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    full_name_en: Mapped[str] = mapped_column(String(150), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(30), nullable=False)
    
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    auth_token_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    verification_status: Mapped[FaydaVerificationStatus] = mapped_column(
        Enum(FaydaVerificationStatus, name="fayda_verification_status_enum", native_enum=False),
        default=FaydaVerificationStatus.VERIFIED,
        nullable=False,
    )
    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship("Patient")
