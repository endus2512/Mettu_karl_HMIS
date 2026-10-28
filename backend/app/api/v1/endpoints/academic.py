"""
Research, Clinical Trials (IRB), and Academic Training Endpoints.
"""
from datetime import date, datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.academic import AcademicLogbook, IRBProtocol, IRBStatus
from app.models.user import User
from app.schemas.academic import (
    AcademicLogbookCreate,
    AcademicLogbookResponse,
    IRBProtocolCreate,
    IRBProtocolResponse,
)

router = APIRouter()


@router.post("/irb-protocols", response_model=IRBProtocolResponse, status_code=status.HTTP_201_CREATED, summary="Submit IRB Protocol")
async def submit_irb_protocol(
    protocol_in: IRBProtocolCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> IRBProtocol:
    """Submit clinical research protocol to the Institutional Review Board (IRB)."""
    protocol = IRBProtocol(
        **protocol_in.model_dump(),
        status=IRBStatus.SUBMITTED,
        created_at=datetime.now(timezone.utc),
    )
    db.add(protocol)
    await db.commit()
    await db.refresh(protocol)
    return protocol


@router.get("/irb-protocols", response_model=List[IRBProtocolResponse], summary="List IRB Protocols")
async def list_irb_protocols(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: Optional[IRBStatus] = Query(None, alias="status", description="Filter by ethical review status"),
) -> List[IRBProtocol]:
    """List hospital-approved or under-review research clinical trials."""
    query = select(IRBProtocol).order_by(IRBProtocol.created_at.desc())
    if status_filter:
        query = query.where(IRBProtocol.status == status_filter)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/irb-protocols/{protocol_id}/approve", response_model=IRBProtocolResponse, summary="Approve IRB Protocol")
async def approve_irb_protocol(
    protocol_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> IRBProtocol:
    """IRB Committee approval for ethical human subject trial."""
    result = await db.execute(select(IRBProtocol).where(IRBProtocol.id == protocol_id))
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="IRB protocol not found")

    protocol.status = IRBStatus.APPROVED
    protocol.approval_date = date.today()
    await db.commit()
    await db.refresh(protocol)
    return protocol


@router.post("/logbooks", response_model=AcademicLogbookResponse, status_code=status.HTTP_201_CREATED, summary="Log Clinical Procedure")
async def log_procedure(
    log_in: AcademicLogbookCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AcademicLogbook:
    """Log surgical or diagnostic procedure performed by medical resident or intern."""
    entry = AcademicLogbook(
        **log_in.model_dump(),
        trainee_id=current_user.id,
        supervisor_verified=False,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/logbooks", response_model=List[AcademicLogbookResponse], summary="List Procedure Logbooks")
async def list_logbooks(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    trainee_id: Optional[int] = Query(None, description="Filter procedures by medical student/resident ID"),
) -> List[AcademicLogbook]:
    """Retrieve verified and pending academic training logbook entries."""
    query = select(AcademicLogbook).order_by(AcademicLogbook.performed_date.desc())
    if trainee_id:
        query = query.where(AcademicLogbook.trainee_id == trainee_id)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/logbooks/{entry_id}/verify", response_model=AcademicLogbookResponse, summary="Attending Sign-Off on Logbook")
async def verify_logbook_entry(
    entry_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AcademicLogbook:
    """Consultant or attending physician clinical sign-off on procedure performed by trainee."""
    result = await db.execute(select(AcademicLogbook).where(AcademicLogbook.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Logbook entry not found")

    entry.supervisor_verified = True
    entry.supervisor_id = current_user.id
    await db.commit()
    await db.refresh(entry)
    return entry
