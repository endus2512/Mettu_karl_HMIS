"""
Queue Management and Live WebSocket TV Token System endpoints.
"""
from typing import Annotated, List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.queue import (
    QueueDepartment,
    QueueTicket,
    TicketStatus,
)
from app.models.user import User
from app.schemas.queue import (
    CallNextRequest,
    QueueDepartmentResponse,
    TicketCreate,
    TicketResponse,
)
from app.services.queue_service import (
    call_next_patient,
    issue_queue_ticket,
    ws_queue_manager,
)

router = APIRouter()


@router.get("/departments", response_model=List[QueueDepartmentResponse], summary="List Queue Departments")
async def list_departments(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> List[QueueDepartment]:
    """Fetch active queue departments (OPD, Triage, Lab, Pharmacy, Cashier)."""
    stmt = select(QueueDepartment).where(QueueDepartment.is_active.is_(True))
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED, summary="Issue New Token Ticket")
async def issue_ticket(
    ticket_in: TicketCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TicketResponse:
    """Issue a new numbered queue token ticket for a patient."""
    try:
        ticket = await issue_queue_ticket(
            db,
            department_code=ticket_in.department_code,
            patient_id=ticket_in.patient_id,
            priority=ticket_in.priority,
        )
        return TicketResponse(
            id=ticket.id,
            ticket_number=ticket.ticket_number,
            department_code=ticket_in.department_code,
            patient_id=ticket.patient_id,
            status=ticket.status,
            priority=ticket.priority,
            room_counter=ticket.room_counter,
            created_at=ticket.created_at,
            called_at=ticket.called_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/call-next", response_model=Optional[TicketResponse], summary="Call Next Patient (Doctor / Counter)")
async def call_next(
    call_req: CallNextRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[TicketResponse]:
    """Call the next patient in line. Broadcasts live token update to waiting room TV screens."""
    ticket = await call_next_patient(
        db,
        department_code=call_req.department_code,
        room_counter=call_req.room_counter,
        called_by_user_id=current_user.id,
    )
    if not ticket:
        return None

    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        department_code=call_req.department_code,
        patient_id=ticket.patient_id,
        status=ticket.status,
        priority=ticket.priority,
        room_counter=ticket.room_counter,
        created_at=ticket.created_at,
        called_at=ticket.called_at,
    )


@router.websocket("/ws/{department_code}")
async def queue_websocket(websocket: WebSocket, department_code: str):
    """
    Live WebSocket stream for Waiting Room TV displays and clinical monitors.
    Client receives instantaneous JSON alerts whenever tickets are created or called.
    """
    await ws_queue_manager.connect(websocket, department_code)
    try:
        while True:
            # Keep-alive ping/pong
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_queue_manager.disconnect(websocket, department_code)
