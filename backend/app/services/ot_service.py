"""
Operation Theatre (OT) & CSSD Sterilization management service.
Enforces surgery room conflict avoidance and tracks instrument pack sterility lifecycles.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import uuid

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ot_cssd import (
    CSSDBatch,
    OperatingRoom,
    SterilePack,
    SterilePackStatus,
    SurgeryStatus,
    SurgicalBooking,
)


async def check_ot_room_collision(
    db: AsyncSession,
    room_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: Optional[int] = None,
) -> bool:
    """
    Check if an operating room has any overlapping surgery bookings.
    Returns True if a conflict exists.
    """
    stmt = select(SurgicalBooking).where(
        SurgicalBooking.room_id == room_id,
        SurgicalBooking.status.in_([SurgeryStatus.SCHEDULED, SurgeryStatus.IN_PREP, SurgeryStatus.IN_SURGERY]),
        or_(
            and_(SurgicalBooking.scheduled_start <= start_time, SurgicalBooking.scheduled_end > start_time),
            and_(SurgicalBooking.scheduled_start < end_time, SurgicalBooking.scheduled_end >= end_time),
            and_(SurgicalBooking.scheduled_start >= start_time, SurgicalBooking.scheduled_end <= end_time),
        ),
    )
    if exclude_booking_id:
        stmt = stmt.where(SurgicalBooking.id != exclude_booking_id)

    res = await db.execute(stmt)
    return res.scalar_one_or_none() is not None


async def create_surgical_booking(
    db: AsyncSession,
    patient_id: int,
    room_id: int,
    procedure_name: str,
    lead_surgeon_id: int,
    scheduled_start: datetime,
    scheduled_end: datetime,
    anesthesiologist_id: Optional[int] = None,
    scrub_nurse_id: Optional[int] = None,
) -> SurgicalBooking:
    """Book an operating room table with conflict verification."""
    has_conflict = await check_ot_room_collision(db, room_id, scheduled_start, scheduled_end)
    if has_conflict:
        raise ValueError("Operating Room collision: Another surgical procedure is already booked during this time window")

    booking_code = f"SURG-{uuid.uuid4().hex[:8].upper()}"
    booking = SurgicalBooking(
        booking_code=booking_code,
        patient_id=patient_id,
        room_id=room_id,
        procedure_name=procedure_name,
        lead_surgeon_id=lead_surgeon_id,
        anesthesiologist_id=anesthesiologist_id,
        scrub_nurse_id=scrub_nurse_id,
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
        status=SurgeryStatus.SCHEDULED,
        who_safety_checklist_verified=False,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


async def get_active_sterile_packs(db: AsyncSession, pack_name: Optional[str] = None) -> List[SterilePack]:
    """Retrieve sterilized surgical sets that have not expired and are ready for surgery."""
    now = datetime.now(timezone.utc)
    stmt = select(SterilePack).where(
        SterilePack.status == SterilePackStatus.STERILE,
        SterilePack.expiry_date > now,
    )
    if pack_name:
        stmt = stmt.where(SterilePack.pack_name.ilike(f"%{pack_name}%"))

    res = await db.execute(stmt)
    return list(res.scalars().all())
