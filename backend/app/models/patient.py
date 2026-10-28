"""
Patient ORM model mapped for internal clinical operations and FHIR R4 interoperability.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional
import uuid

from sqlalchemy import Date, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Gender(str, enum.Enum):
    """Administrative gender matching FHIR AdministrativeGender value set."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"


class Patient(Base):
    """
    Patient master record model.
    Maintains internal clinical identifier (MRN) and FHIR UUID.
    """
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mrn: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    fhir_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        default=lambda: f"pat-mkrh-{uuid.uuid4().hex[:12]}",
        nullable=False,
    )

    # Demographic data
    first_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), index=True, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[Gender] = mapped_column(
        Enum(Gender, name="patient_gender_enum", native_enum=False),
        nullable=False,
    )

    # Address / Locality
    address_line: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), default="Mettu", nullable=True)
    state_province: Mapped[Optional[str]] = mapped_column(String(100), default="Oromia", nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Operational status
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
