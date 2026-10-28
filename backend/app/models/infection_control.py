"""
Infection Control, Hospital-Acquired Infections (HAI) & EPHI PHEM Surveillance ORM models.
Supports IPPS compliance, pathogen monitoring, and Ethiopian Public Health Institute epidemic alerts.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class HAIType(str, enum.Enum):
    SURGICAL_SITE_INFECTION = "surgical_site_infection"
    CAUTI = "cauti" # Catheter-Associated Urinary Tract Infection
    CLABSI = "clabsi" # Central Line-Associated Bloodstream Infection
    VAP = "vap" # Ventilator-Associated Pneumonia
    HOSPITAL_ACQUIRED_PNEUMONIA = "hospital_acquired_pneumonia"


class PHEMDiseaseCategory(str, enum.Enum):
    CHOLERA = "cholera"
    MEASLES = "measles"
    MALARIA_EPIDEMIC = "malaria_epidemic"
    MENINGITIS = "meningitis"
    RABIES = "rabies"
    POLIO_AFP = "polio_afp"
    ANTHRAX = "anthrax"
    OTHER = "other"


class HospitalAcquiredInfectionLog(Base):
    """Internal surveillance record of hospital-acquired infection (HAI)."""
    __tablename__ = "hai_surveillance_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    hai_type: Mapped[HAIType] = mapped_column(
        Enum(HAIType, name="hai_type_enum", native_enum=False),
        nullable=False,
    )
    ward: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Surgical Ward", "ICU"
    detected_date: Mapped[date] = mapped_column(Date, nullable=False)
    pathogen_isolated: Mapped[Optional[str]] = mapped_column(String(150), nullable=True) # e.g. "MRSA", "Pseudomonas aeruginosa"
    antibiotic_sensitivity: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_isolated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False) # Contact/airborne isolation
    investigating_nurse: Mapped[str] = mapped_column(String(150), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship("Patient")


class PHEMOutbreakReport(Base):
    """Weekly/Immediate notifiable disease report to Ethiopian Public Health Institute (EPHI)."""
    __tablename__ = "phem_outbreak_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "PHEM-MKH-2026-W42-01"
    disease_category: Mapped[PHEMDiseaseCategory] = mapped_column(
        Enum(PHEMDiseaseCategory, name="phem_disease_enum", native_enum=False),
        nullable=False,
    )
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    kebele_origin: Mapped[str] = mapped_column(String(100), nullable=False)
    woreda_origin: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Mettu Woreda", "Yayo Woreda"
    
    sample_sent_to_ephi: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ephi_lab_result: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "Vibrio cholerae O1 confirmed"
    outcome: Mapped[str] = mapped_column(String(50), default="Under Treatment", nullable=False) # e.g. "Discharged", "Died"
    
    reported_to_ephi_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship("Patient")
