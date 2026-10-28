"""
Patient CRM & Grievance Redressal API Endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.crm import GrievancePriority, GrievanceStatus, GrievanceTicket, PatientFeedback
from app.models.user import User
from app.schemas.crm import (
    GrievanceResolveRequest,
    GrievanceTicketCreate,
    GrievanceTicketResponse,
    PatientFeedbackCreate,
    PatientFeedbackResponse,
)
from app.services.crm_service import create_grievance_ticket

router = APIRouter()


@router.post("/feedback", response_model=PatientFeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Submit CSAT Feedback")
async def submit_patient_feedback(
    feedback_in: PatientFeedbackCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PatientFeedback:
    """Submit patient satisfaction (CSAT) rating and comments."""
    feedback = PatientFeedback(**feedback_in.model_dump())
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


@router.get("/feedback", response_model=List[PatientFeedbackResponse], summary="List Patient Feedback")
async def list_patient_feedback(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    department: Optional[str] = Query(None, description="Filter by clinical or operational department"),
    limit: int = Query(50, ge=1, le=200),
) -> List[PatientFeedback]:
    """Retrieve submitted CSAT ratings and reviews."""
    query = select(PatientFeedback).order_by(PatientFeedback.submitted_at.desc()).limit(limit)
    if department:
        query = query.where(PatientFeedback.department == department)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/grievances", response_model=GrievanceTicketResponse, status_code=status.HTTP_201_CREATED, summary="Lodge Grievance Ticket")
async def lodge_grievance_ticket(
    ticket_in: GrievanceTicketCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GrievanceTicket:
    """Lodge patient or family grievance with automatic SLA deadline assignment."""
    ticket = await create_grievance_ticket(
        db=db,
        complainant_name=ticket_in.complainant_name,
        contact_phone=ticket_in.contact_phone,
        category=ticket_in.category,
        priority=ticket_in.priority,
        assigned_department=ticket_in.assigned_department,
        complaint_details=ticket_in.complaint_details,
        patient_id=ticket_in.patient_id,
    )
    return ticket


@router.get("/grievances", response_model=List[GrievanceTicketResponse], summary="List Grievance Tickets")
async def list_grievance_tickets(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: Optional[GrievanceStatus] = Query(None, alias="status", description="Filter by grievance status"),
    priority: Optional[GrievancePriority] = Query(None, description="Filter by priority SLA"),
) -> List[GrievanceTicket]:
    """Retrieve grievance tickets for hospital quality management."""
    query = select(GrievanceTicket).order_by(GrievanceTicket.sla_due_date.asc())
    if status_filter:
        query = query.where(GrievanceTicket.status == status_filter)
    if priority:
        query = query.where(GrievanceTicket.priority == priority)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/grievances/{ticket_id}/resolve", response_model=GrievanceTicketResponse, summary="Resolve Grievance Ticket")
async def resolve_grievance_ticket(
    ticket_id: int,
    resolve_in: GrievanceResolveRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GrievanceTicket:
    """Mark grievance as resolved and document corrective action."""
    result = await db.execute(select(GrievanceTicket).where(GrievanceTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance ticket not found")

    ticket.status = GrievanceStatus.RESOLVED
    ticket.resolution_summary = resolve_in.resolution_summary
    ticket.resolved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(ticket)
    return ticket
