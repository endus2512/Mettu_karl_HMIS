"""
Patient CRM & Grievance Redressal SLA tracking service.
"""
from datetime import datetime, timedelta, timezone
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crm import (
    GrievanceCategory,
    GrievancePriority,
    GrievanceStatus,
    GrievanceTicket,
)


def compute_grievance_sla_due_date(priority: GrievancePriority) -> datetime:
    """Compute SLA target resolution deadline based on severity priority."""
    now = datetime.now(timezone.utc)
    if priority == GrievancePriority.CRITICAL:
        return now + timedelta(hours=4)
    elif priority == GrievancePriority.HIGH:
        return now + timedelta(hours=24)
    elif priority == GrievancePriority.MEDIUM:
        return now + timedelta(days=3)
    else:
        return now + timedelta(days=7)


async def create_grievance_ticket(
    db: AsyncSession,
    complainant_name: str,
    contact_phone: str,
    category: GrievanceCategory,
    priority: GrievancePriority,
    assigned_department: str,
    complaint_details: str,
    patient_id: int = None,
) -> GrievanceTicket:
    """Register formal grievance with automatic SLA deadline assignment."""
    ticket_num = f"GRV-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:6].upper()}"
    due_date = compute_grievance_sla_due_date(priority)

    ticket = GrievanceTicket(
        ticket_number=ticket_num,
        patient_id=patient_id,
        complainant_name=complainant_name,
        contact_phone=contact_phone,
        category=category,
        priority=priority,
        status=GrievanceStatus.SUBMITTED,
        assigned_department=assigned_department,
        complaint_details=complaint_details,
        sla_due_date=due_date,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket
