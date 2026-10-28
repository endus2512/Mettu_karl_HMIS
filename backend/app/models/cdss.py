"""
Clinical Decision Support System (CDSS) ORM models.
Includes Drug-Drug Interactions (DDI) catalog and Patient Allergies.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SeverityLevel(str, enum.Enum):
    INFO = "info"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


class DrugInteraction(Base):
    """Pairwise drug-drug adverse interaction knowledge base."""
    __tablename__ = "drug_interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    drug_a_name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    drug_b_name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    severity: Mapped[SeverityLevel] = mapped_column(
        Enum(SeverityLevel, name="interaction_severity_enum", native_enum=False),
        nullable=False,
    )
    clinical_effect: Mapped[str] = mapped_column(String(500), nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)


class PatientAllergy(Base):
    """Documented adverse drug or substance allergies per patient."""
    __tablename__ = "patient_allergies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    substance: Mapped[str] = mapped_column(String(150), index=True, nullable=False)  # e.g., "Penicillin", "Sulfa"
    reaction: Mapped[str] = mapped_column(String(255), nullable=False)               # e.g., "Anaphylaxis", "Rash"
    severity: Mapped[SeverityLevel] = mapped_column(
        Enum(SeverityLevel, name="allergy_severity_enum", native_enum=False),
        default=SeverityLevel.MODERATE,
        nullable=False,
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
