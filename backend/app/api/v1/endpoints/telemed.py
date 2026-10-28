"""
Telemedicine and WebRTC Video Consultation session endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.appointment import (
    Appointment,
    AppointmentStatus,
    TelemedSession,
)
from app.models.user import User
from app.schemas.appointment import (
    TelemedSessionCreate,
    TelemedSessionResponse,
)

router = APIRouter()


@router.post("/sessions", response_model=TelemedSessionResponse, status_code=status.HTTP_201_CREATED, summary="Create Telemedicine Video Room")
async def create_telemed_session(
    session_in: TelemedSessionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TelemedSessionResponse:
    """Initialize a WebRTC encrypted video consultation room."""
    room_id = f"room-{uuid.uuid4().hex[:16]}"

    session = TelemedSession(
        room_id=room_id,
        appointment_id=session_in.appointment_id,
        doctor_id=current_user.id,
        patient_id=session_in.patient_id,
        is_active=True,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    room_url = f"https://his.mettukarl.hospital/telemed/{room_id}"

    return TelemedSessionResponse(
        id=session.id,
        room_id=session.room_id,
        patient_id=session.patient_id,
        doctor_id=session.doctor_id,
        is_active=session.is_active,
        started_at=session.started_at,
        webrtc_room_url=room_url,
    )


@router.post("/sessions/{room_id}/end", summary="End Telemedicine Video Room")
async def end_telemed_session(
    room_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Close active telemedicine session and record end time."""
    stmt = select(TelemedSession).where(TelemedSession.room_id == room_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.is_active = False
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "Telemedicine consultation successfully closed"}
