"""
Ambulance Fleet, 907 Emergency Dispatch, and GPS tracking service.
"""
from datetime import datetime, timezone
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ems import (
    Ambulance,
    DispatchStatus,
    EmergencyCall,
    TriageLevel,
)


def _normalize_triage_level(t_val: str | TriageLevel) -> TriageLevel:
    if isinstance(t_val, TriageLevel):
        return t_val
    val_str = str(t_val).lower().replace("triagelevel.", "")
    for member in TriageLevel:
        if member.value == val_str or member.name.lower() == val_str:
            return member
    return TriageLevel.RED


async def register_emergency_call(
    db: AsyncSession,
    caller_phone: str,
    caller_name: str = "Hotline 907 Caller",
    location_address: str = "Mettu City Center",
    chief_complaint: str = "Emergency trauma request",
    triage_level: str | TriageLevel = TriageLevel.RED,
    location_lat: Optional[float] = None,
    location_lon: Optional[float] = None,
    paramedic_notes: Optional[str] = None,
) -> EmergencyCall:
    """Log incoming 907 community emergency call."""
    incident_code = f"EMS-{uuid.uuid4().hex[:8].upper()}"
    t_level = _normalize_triage_level(triage_level)

    call = EmergencyCall(
        incident_code=incident_code,
        caller_name=caller_name,
        caller_phone=caller_phone,
        location_address=location_address,
        incident_location=location_address,
        location_lat=location_lat,
        location_lon=location_lon,
        triage_level=t_level,
        chief_complaint=chief_complaint,
        emergency_description=chief_complaint,
        status=DispatchStatus.RECEIVED,
        dispatch_status="pending",
        paramedic_notes=paramedic_notes,
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
    call.status = DispatchStatus.EN_ROUTE
    call.dispatch_status = "en_route"
    call.dispatched_at = datetime.now(timezone.utc)
    ambulance.is_available = False

    await db.commit()
    await db.refresh(call)
    return call
