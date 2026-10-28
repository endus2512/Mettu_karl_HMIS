"""
Pydantic schemas for Patient CRM, Feedback (CSAT), and Grievance SLA Ticketing.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.crm import GrievanceCategory, GrievancePriority, GrievanceStatus


class PatientFeedbackCreate(BaseModel):
    patient_id: Optional[int] = None
    department: str
    rating_stars: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None


class PatientFeedbackResponse(PatientFeedbackCreate):
    id: int
    submitted_at: datetime

    model_config = {"from_attributes": True}


class GrievanceTicketCreate(BaseModel):
    patient_id: Optional[int] = None
    complainant_name: str
    contact_phone: str
    category: GrievanceCategory
    priority: GrievancePriority = GrievancePriority.MEDIUM
    assigned_department: str
    complaint_details: str


class GrievanceTicketResponse(GrievanceTicketCreate):
    id: int
    ticket_number: str
    status: GrievanceStatus
    resolution_summary: Optional[str] = None
    sla_due_date: datetime
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GrievanceResolveRequest(BaseModel):
    resolution_summary: str
