"""
Hospital Mortuary, Cold Vaults, and Autopsy ORM models.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VaultStatus(str, enum.Enum):
    VACANT = "vacant"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class BodyVault(Base):
    """Refrigerated body preservation compartments in the hospital mortuary."""
    __tablename__ = "body_vaults"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vault_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False) # e.g. "VAULT-A01"
    temperature_celsius: Mapped[float] = mapped_column(Float, default=2.0, nullable=False) # Typically 2°C to 4°C
    status: Mapped[VaultStatus] = mapped_column(
        Enum(VaultStatus, name="vault_status_enum", native_enum=False),
        default=VaultStatus.VACANT,
        nullable=False,
    )

    records: Mapped[list["MortuaryRecord"]] = relationship("MortuaryRecord", back_populates="vault")


class MortuaryRecord(Base):
    """Deceased admission, preservation, autopsy, and legal release log."""
    __tablename__ = "mortuary_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tag_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "MORT-2026-0012"
    patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)

    deceased_name: Mapped[str] = mapped_column(String(150), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    datetime_of_death: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cause_of_death: Mapped[str] = mapped_column(String(255), nullable=False)
    declaring_doctor_name: Mapped[str] = mapped_column(String(100), nullable=False)

    body_vault_id: Mapped[Optional[int]] = mapped_column(ForeignKey("body_vaults.id", ondelete="SET NULL"), nullable=True)
    death_certificate_number: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    is_autopsy_conducted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    released_to_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    released_to_relationship: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    vault: Mapped[Optional["BodyVault"]] = relationship("BodyVault", back_populates="records")
