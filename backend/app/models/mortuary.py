"""
Hospital Mortuary, Cold Vaults, and Autopsy ORM models.
"""
from datetime import datetime, timezone, date, time
import enum
from typing import Optional
import uuid

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
    vault_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    bay_name: Mapped[Optional[str]] = mapped_column(String(100), default="Bay 1 Top", nullable=True)
    temperature_celsius: Mapped[float] = mapped_column(Float, default=2.0, nullable=False) # Typically 2°C to 4°C
    status: Mapped[VaultStatus] = mapped_column(
        Enum(VaultStatus, name="vault_status_enum", native_enum=False),
        default=VaultStatus.VACANT,
        nullable=False,
    )

    records: Mapped[list["MortuaryRecord"]] = relationship("MortuaryRecord", back_populates="vault")

    def __init__(self, **kwargs):
        if "vault_number" in kwargs and "vault_code" not in kwargs:
            kwargs["vault_code"] = kwargs.get("vault_number")
        elif "vault_code" in kwargs and "vault_number" not in kwargs:
            kwargs["vault_number"] = kwargs.get("vault_code")
        super().__init__(**kwargs)


class MortuaryRecord(Base):
    """Deceased admission, preservation, autopsy, and legal release log."""
    __tablename__ = "mortuary_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tag_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "MORT-2026-0012"
    patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)

    deceased_name: Mapped[str] = mapped_column(String(150), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), default="UNKNOWN", nullable=False)
    datetime_of_death: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cause_of_death: Mapped[str] = mapped_column(String(255), nullable=False)
    declaring_doctor_name: Mapped[str] = mapped_column(String(100), nullable=False)

    body_vault_id: Mapped[Optional[int]] = mapped_column(ForeignKey("body_vaults.id", ondelete="SET NULL"), nullable=True)
    death_certificate_number: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    is_autopsy_conducted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    autopsy_findings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pathologist_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    autopsy_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    burial_permit_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    police_case_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    released_to_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    released_to_relationship: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_kin_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    contact_kin_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    released_to_kin: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)

    vault: Mapped[Optional["BodyVault"]] = relationship("BodyVault", back_populates="records")

    def __init__(self, **kwargs):
        if "certifying_physician" in kwargs and "declaring_doctor_name" not in kwargs:
            kwargs["declaring_doctor_name"] = kwargs.get("certifying_physician")
        if "vault_id" in kwargs and "body_vault_id" not in kwargs:
            kwargs["body_vault_id"] = kwargs.get("vault_id")
        if "contact_kin_name" in kwargs and "released_to_name" not in kwargs:
            kwargs["released_to_name"] = kwargs.get("contact_kin_name")

        if "datetime_of_death" not in kwargs:
            dod_date = kwargs.get("date_of_death")
            dod_time = kwargs.get("time_of_death")
            if dod_date:
                dt_str = f"{dod_date} {dod_time or '00:00:00'}"
                try:
                    kwargs["datetime_of_death"] = datetime.fromisoformat(dt_str).replace(tzinfo=timezone.utc)
                except Exception:
                    kwargs["datetime_of_death"] = datetime.now(timezone.utc)
            else:
                kwargs["datetime_of_death"] = datetime.now(timezone.utc)

        if "gender" not in kwargs:
            kwargs["gender"] = "UNKNOWN"
        if "tag_number" not in kwargs:
            kwargs["tag_number"] = f"MORT-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:6].upper()}"

        super().__init__(**kwargs)
