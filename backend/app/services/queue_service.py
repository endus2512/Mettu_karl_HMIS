"""
Queue Management and WebSocket Live Broadcast service.
Distributes real-time ticket events to waiting room TV dashboards and patient monitors.
"""
from datetime import datetime, timezone
import json
import logging
from typing import Dict, List, Optional, Set

from fastapi import WebSocket
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.queue import (
    QueueDepartment,
    QueueTicket,
    TicketPriority,
    TicketStatus,
)
from app.schemas.queue import QueueWSMessage

logger = logging.getLogger(__name__)


class QueueConnectionManager:
    """Manages active WebSocket connections to waiting room TV monitors."""

    def __init__(self):
        # department_code -> set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, department_code: str):
        await websocket.accept()
        if department_code not in self.active_connections:
            self.active_connections[department_code] = set()
        self.active_connections[department_code].add(websocket)
        logger.info(f"WebSocket client connected to queue: {department_code}")

    def disconnect(self, websocket: WebSocket, department_code: str):
        if department_code in self.active_connections:
            self.active_connections[department_code].discard(websocket)
            if not self.active_connections[department_code]:
                del self.active_connections[department_code]
        logger.info(f"WebSocket client disconnected from queue: {department_code}")

    async def broadcast_event(self, department_code: str, message: QueueWSMessage):
        """Broadcast live token event to all connected TV screens and department monitors."""
        payload = message.model_dump_json()
        targets = set()

        # Department specific screens
        if department_code in self.active_connections:
            targets.update(self.active_connections[department_code])

        # Global hospital monitors (subscribed to "ALL")
        if "ALL" in self.active_connections:
            targets.update(self.active_connections["ALL"])

        for connection in targets:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting WebSocket message: {e}")


ws_queue_manager = QueueConnectionManager()


async def issue_queue_ticket(
    db: AsyncSession,
    department_code: str,
    patient_id: Optional[int] = None,
    priority: TicketPriority = TicketPriority.ROUTINE,
) -> QueueTicket:
    """Issue a new numbered queue token ticket."""
    dept_stmt = select(QueueDepartment).where(QueueDepartment.code == department_code)
    dept_res = await db.execute(dept_stmt)
    department = dept_res.scalar_one_or_none()

    if not department:
        raise ValueError(f"Queue department '{department_code}' does not exist")

    # Count today's tickets for this department to generate sequence number
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count_stmt = select(func.count(QueueTicket.id)).where(
        QueueTicket.department_id == department.id,
        QueueTicket.created_at >= today_start,
    )
    count_res = await db.execute(count_stmt)
    seq = count_res.scalar_one() + 1

    ticket_number = f"{department.token_prefix}-{seq:03d}"

    ticket = QueueTicket(
        ticket_number=ticket_number,
        department_id=department.id,
        patient_id=patient_id,
        priority=priority,
        status=TicketStatus.WAITING,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    # Broadcast new ticket
    await ws_queue_manager.broadcast_event(
        department_code=department.code,
        message=QueueWSMessage(
            event_type="TICKET_CREATED",
            ticket_number=ticket.ticket_number,
            room_counter="Waiting Area",
            department_name=department.name,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ),
    )

    return ticket


async def call_next_patient(
    db: AsyncSession,
    department_code: str,
    room_counter: str,
    called_by_user_id: Optional[int] = None,
) -> Optional[QueueTicket]:
    """Call the next patient in line (Urgent/Emergency first, then oldest waiting)."""
    dept_stmt = select(QueueDepartment).where(QueueDepartment.code == department_code)
    dept_res = await db.execute(dept_stmt)
    department = dept_res.scalar_one_or_none()

    if not department:
        return None

    # Priority ordering: EMERGENCY (desc), then created_at (asc)
    next_stmt = (
        select(QueueTicket)
        .where(
            QueueTicket.department_id == department.id,
            QueueTicket.status == TicketStatus.WAITING,
        )
        .order_by(
            QueueTicket.priority.desc(),
            QueueTicket.created_at.asc(),
        )
        .limit(1)
    )
    ticket_res = await db.execute(next_stmt)
    ticket = ticket_res.scalar_one_or_none()

    if not ticket:
        return None

    now = datetime.now(timezone.utc)
    ticket.status = TicketStatus.CALLED
    ticket.room_counter = room_counter
    ticket.called_at = now
    ticket.called_by_user_id = called_by_user_id

    await db.commit()
    await db.refresh(ticket)

    # Broadcast live call to TV screens
    await ws_queue_manager.broadcast_event(
        department_code=department.code,
        message=QueueWSMessage(
            event_type="TICKET_CALLED",
            ticket_number=ticket.ticket_number,
            room_counter=room_counter,
            department_name=department.name,
            timestamp=now.isoformat(),
        ),
    )

    return ticket
