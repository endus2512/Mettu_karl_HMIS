"""
Biomedical Waste Management, Segregation, and Incinerator Log ORM models.
Complies with WHO Healthcare Waste and Ethiopian Environmental Protection Standards.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WasteCategory(str, enum.Enum):
    YELLOW_INFECTIOUS = "yellow_infectious"      # Pathological, body fluids, soiled gauze
    RED_SHARPS = "red_sharps"                    # Needles, scalpels, glass ampoules
    BROWN_PHARMACEUTICAL = "brown_pharmaceutical"# Expired drugs, cytotoxic chemicals
    BLACK_GENERAL = "black_general"              # Non-hazardous cardboard, food packaging


class DisposalMethod(str, enum.Enum):
    INCINERATION = "incineration"
    AUTOCLAVE_DISINFECTION = "autoclave"
    MUNICIPAL_LANDFILL = "landfill"


class MedicalWasteLog(Base):
    """Daily departmental hazardous waste collection and weight log."""
    __tablename__ = "medical_waste_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    waste_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    category: Mapped[WasteCategory] = mapped_column(
        Enum(WasteCategory, name="waste_category_enum", native_enum=False),
        nullable=False,
    )
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)

    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    disposed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    disposal_method: Mapped[DisposalMethod] = mapped_column(
        Enum(DisposalMethod, name="disposal_method_enum", native_enum=False),
        default=DisposalMethod.INCINERATION,
        nullable=False,
    )
    handler_name: Mapped[str] = mapped_column(String(100), nullable=False)


class IncineratorBatch(Base):
    """Hospital high-temperature medical waste incinerator burn cycle."""
    __tablename__ = "incinerator_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    total_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)

    chamber_1_temp_celsius: Mapped[float] = mapped_column(Float, default=850.0, nullable=False)  # Primary chamber
    chamber_2_temp_celsius: Mapped[float] = mapped_column(Float, default=1100.0, nullable=False) # Secondary post-combustion
    burn_duration_min: Mapped[int] = mapped_column(Integer, default=90, nullable=False)
    emission_scrubber_normal: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    burned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    operator_name: Mapped[str] = mapped_column(String(100), nullable=False)
