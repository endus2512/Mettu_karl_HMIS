"""
Operation Theatre (OT) Scheduling and CSSD Sterilization Pack endpoints.
"""
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.ot_cssd import (
    CSSDBatch,
    OperatingRoom,
    SterilePack,
    SterilePackStatus,
    SurgicalBooking,
)
from app.models.user import User, UserRole
from app.schemas.ot_cssd import (
    CSSDBatchCreate,
    CSSDBatchResponse,
    OperatingRoomCreate,
    OperatingRoomResponse,
    SterilePackCreate,
    SterilePackResponse,
    SurgicalBookingCreate,
    SurgicalBookingResponse,
)
from app.services.ot_service import create_surgical_booking, get_active_sterile_packs

router = APIRouter()

doctor_guard = require_roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN)
nurse_tech_guard = require_roles(UserRole.NURSE, UserRole.TECHNICIAN, UserRole.SUPER_ADMIN)


@router.get("/rooms", response_model=List[OperatingRoomResponse], summary="List Operating Theatre Suites")
async def list_ot_rooms(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[OperatingRoom]:
    """Retrieve surgical operating theatre suites."""
    res = await db.execute(select(OperatingRoom).where(OperatingRoom.is_active.is_(True)))
    return list(res.scalars().all())


@router.post("/rooms", response_model=OperatingRoomResponse, status_code=status.HTTP_201_CREATED, summary="Create OT Suite")
async def create_ot_room(
    room_in: OperatingRoomCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OperatingRoom:
    """Register a new operating room."""
    room = OperatingRoom(**room_in.model_dump())
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room


@router.post("/bookings", response_model=SurgicalBookingResponse, status_code=status.HTTP_201_CREATED, summary="Schedule Surgery")
async def book_surgery(
    booking_in: SurgicalBookingCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(doctor_guard)],
) -> SurgicalBooking:
    """Schedule surgery with automatic operating room collision prevention."""
    try:
        return await create_surgical_booking(
            db,
            patient_id=booking_in.patient_id,
            room_id=booking_in.room_id,
            procedure_name=booking_in.procedure_name,
            lead_surgeon_id=booking_in.lead_surgeon_id,
            scheduled_start=booking_in.scheduled_start,
            scheduled_end=booking_in.scheduled_end,
            anesthesiologist_id=booking_in.anesthesiologist_id,
            scrub_nurse_id=booking_in.scrub_nurse_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/cssd/batches", response_model=CSSDBatchResponse, status_code=status.HTTP_201_CREATED, summary="Record CSSD Sterilization Cycle")
async def record_cssd_batch(
    batch_in: CSSDBatchCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(nurse_tech_guard)],
) -> CSSDBatch:
    """Record autoclave cycle parameters (temperature, pressure, biological indicator)."""
    batch_code = f"CSSD-{uuid.uuid4().hex[:8].upper()}"
    batch = CSSDBatch(
        batch_code=batch_code,
        sterilizer_unit_name=batch_in.sterilizer_unit_name,
        sterilizer_type=batch_in.sterilizer_type,
        temperature_celsius=batch_in.temperature_celsius,
        pressure_bar=batch_in.pressure_bar,
        cycle_duration_min=batch_in.cycle_duration_min,
        biological_indicator_passed=batch_in.biological_indicator_passed,
        operator_id=current_user.id,
    )
    db.add(batch)
    await db.commit()
    await db.refresh(batch)
    return batch


@router.get("/cssd/packs", response_model=List[SterilePackResponse], summary="List Ready Sterile Surgical Packs")
async def list_sterile_packs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    name: Optional[str] = Query(None, description="Filter pack by name"),
) -> List[SterilePack]:
    """Retrieve sterilized instrument packs verified for surgical table use."""
    return await get_active_sterile_packs(db, pack_name=name)
