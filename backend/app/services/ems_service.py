"""
Ambulance Fleet, 907 Emergency Dispatch, and GPS tracking service.
"""
from datetime import datetime, timezone
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ems import (
    Ambulance,
    DispatchStatus,
    EmergencyCall,
    TriageLevel,
)


async def register_emergency_call(
    db: AsyncSession,
    caller_name: str,
    caller_phone: str,
    location_address: str,
    chief_complaint: str,
    triage_level: TriageLevel = TriageLevel.RED,
    location_lat: float = None,
    location_lon: float = None,
) -> EmergencyCall:
    """Log incoming 907 community emergency call."""
    incident_code = f"EMS-{uuid.uuid4().hex[:8].upper()}"

    call = EmergencyCall(
        incident_code=incident_code,
        caller_name=caller_name,
        caller_phone=caller_phone,
        location_address=location_address,
        location_lat=location_lat,
        location_lon=location_lon,
        triage_level=triage_level,
        chief_complaint=chief_complaint,
        status=DispatchStatus.RECEIVED,
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)
    return call


async def dispatch_ambulance(
    db: AsyncSession,
    incident_id: int,
    ambulance_id: int,
) -> EmergencyCall:
    """Assign available ambulance to emergency call and mark en route."""
    call_stmt = select(EmergencyCall).where(EmergencyCall.id == incident_id)
    call_res = await db.execute(call_stmt)
    call = call_res.scalar_one_or_none()

    amb_stmt = select(Ambulance).where(Ambulance.id == ambulance_id)
    amb_res = await db.execute(amb_stmt)
    ambulance = amb_res.scalar_one_or_none()

    if not call or not ambulance:
        raise ValueError("Emergency call or ambulance vehicle not found")

    call.ambulance_id = ambulance.id
    call.status = DispatchStatus.DISPATCHED
    call.dispatched_at = datetime.now(timezone.utc)
    ambulance.is_available = False

    await db.commit()
    await db.refresh(call)
    return call
