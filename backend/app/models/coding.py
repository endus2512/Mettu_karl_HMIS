"""
Medical Coding Standards ORM models (ICD-10 / ICD-11 and LOINC).
Supports diagnosis documentation and interoperability with FHIR Condition/DiagnosticReport.
"""
from typing import Optional

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ICD10Code(Base):
    """International Classification of Diseases, 10th/11th Revision catalog."""
    __tablename__ = "icd10_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    description_en: Mapped[str] = mapped_column(String(500), index=True, nullable=False)
    description_om: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Afaan Oromoo
    description_am: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Amharic
    chapter: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    block: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class LOINCCode(Base):
    """Logical Observation Identifiers Names and Codes for Lab and Radiology orders."""
    __tablename__ = "loinc_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    component: Mapped[str] = mapped_column(String(255), index=True, nullable=False)  # e.g., "Hemoglobin", "Glucose"
    system: Mapped[str] = mapped_column(String(100), nullable=False)                  # e.g., "Bld" (Blood), "Urine"
    scale_type: Mapped[str] = mapped_column(String(50), default="Qn", nullable=False) # Qn (Quantitative), Ord (Ordinal)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
