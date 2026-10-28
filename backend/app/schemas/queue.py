"""
Pydantic schemas for Queue Management and Live WebSocket TV Token System.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.queue import TicketPriority, TicketStatus


class QueueDepartmentCreate(BaseModel):
    name: str
    code: str
    token_prefix: str = "A"
    counter_name: str = "Room 1"


class QueueDepartmentResponse(QueueDepartmentCreate):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


class TicketCreate(BaseModel):
    department_code: str
    patient_id: Optional[int] = None
    priority: TicketPriority = TicketPriority.ROUTINE


class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    department_code: str
    patient_id: Optional[int] = None
    status: TicketStatus
    priority: TicketPriority
    room_counter: Optional[str] = None
    created_at: datetime
    called_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CallNextRequest(BaseModel):
    department_code: str
    room_counter: str = Field(..., description="e.g. OPD Room 3, Triage Desk A")


class QueueWSMessage(BaseModel):
    """Real-time payload broadcast over WebSocket to waiting room displays."""
    event_type: str  # "TICKET_CALLED", "TICKET_CREATED", "TICKET_COMPLETED"
    ticket_number: str
    room_counter: str
    department_name: str
    timestamp: str
