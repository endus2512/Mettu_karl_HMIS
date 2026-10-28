"""
Pydantic schemas for Mass Casualty Incident (MCI) and START Disaster Triage.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.mci import MCIIncidentStatus, STARTTriageCategory


class MCIIncidentCreate(BaseModel):
    incident_code: str
    incident_name: str
    incident_location: str
    estimated_casualties: int = Field(20, ge=1)
    incident_commander: str


class MCIIncidentResponse(MCIIncidentCreate):
    id: int
    status: MCIIncidentStatus
    declared_at: datetime
    closed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MCICasualtyTagCreate(BaseModel):
    incident_id: int
    patient_id: Optional[int] = None
    triage_category: STARTTriageCategory
    respiratory_rate: Optional[int] = None
    has_radial_pulse: bool = True
    can_follow_commands: bool = True
    assigned_bay: str
    disposition_notes: Optional[str] = None


class MCICasualtyTagResponse(MCICasualtyTagCreate):
    id: int
    tag_number: str
    tagged_at: datetime

    model_config = {"from_attributes": True}


class MCIStatsResponse(BaseModel):
    incident_code: str
    total_tagged: int
    red_immediate: int
    yellow_delayed: int
    green_minor: int
    black_deceased: int
