"""
Mass Casualty Incident (MCI) & START Disaster Triage ORM models.
Supports rapid disaster intake, Simple Triage and Rapid Treatment (START), and surge capacity.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class STARTTriageCategory(str, enum.Enum):
    RED_IMMEDIATE = "red_immediate"
    YELLOW_DELAYED = "yellow_delayed"
    GREEN_MINOR = "green_minor"
    BLACK_DECEASED = "black_deceased"


class MCIIncidentStatus(str, enum.Enum):
    ACTIVE = "active"
    CONTAINED = "contained"
    STAND_DOWN = "stand_down"


class MassCasualtyIncident(Base):
    """Major disaster or mass casualty event triggering hospital emergency surge protocol."""
    __tablename__ = "mci_incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    incident_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "MCI-MKH-2026-01"
    incident_name: Mapped[str] = mapped_column(String(200), nullable=False) # e.g. "Bus Collision near Sor River"
    incident_location: Mapped[str] = mapped_column(String(200), nullable=False)
    
    declared_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    status: Mapped[MCIIncidentStatus] = mapped_column(
        Enum(MCIIncidentStatus, name="mci_status_enum", native_enum=False),
        default=MCIIncidentStatus.ACTIVE,
        nullable=False,
    )
    estimated_casualties: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    incident_commander: Mapped[str] = mapped_column(String(150), nullable=False) # e.g. "Dr. Bekele (Clinical Director)"
    
    casualties: Mapped[list["MCICasualtyTag"]] = relationship("MCICasualtyTag", back_populates="incident")


class MCICasualtyTag(Base):
    """START Protocol triage tag assigned to disaster victim upon rapid arrival."""
    __tablename__ = "mci_casualty_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("mci_incidents.id", ondelete="CASCADE"), index=True)
    tag_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "MCI-RED-001"
    patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    
    triage_category: Mapped[STARTTriageCategory] = mapped_column(
        Enum(STARTTriageCategory, name="start_triage_enum", native_enum=False),
        nullable=False,
    )
    
    # START physiological triage parameters
    respiratory_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # > 30 is RED
    has_radial_pulse: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False) # Absent is RED
    can_follow_commands: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False) # Unable is RED
    
    assigned_bay: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Trauma Resus Bay 1", "OPD Corridor Holding"
    disposition_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tagged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    incident: Mapped["MassCasualtyIncident"] = relationship("MassCasualtyIncident", back_populates="casualties")
