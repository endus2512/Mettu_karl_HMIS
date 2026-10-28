"""
Ambulance Fleet, 907 Emergency Dispatch, and GPS tracking endpoints.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.ems import Ambulance, EmergencyCall
from app.models.user import User
from app.schemas.ems import (
    AmbulanceCreate,
    AmbulanceResponse,
    DispatchAmbulanceRequest,
    EmergencyCallCreate,
    EmergencyCallResponse,
)
from app.services.ems_service import dispatch_ambulance, register_emergency_call

router = APIRouter()


@router.get("/ambulances", response_model=List[AmbulanceResponse], summary="List Ambulance Fleet")
async def list_ambulances(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[Ambulance]:
    """Retrieve hospital ambulance fleet with current GPS location and readiness."""
    res = await db.execute(select(Ambulance))
    return list(res.scalars().all())


@router.post("/ambulances", response_model=AmbulanceResponse, status_code=status.HTTP_201_CREATED, summary="Add Ambulance to Fleet")
async def register_ambulance(
    amb_in: AmbulanceCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Ambulance:
    """Register a new emergency response vehicle."""
    amb = Ambulance(**amb_in.model_dump())
    db.add(amb)
    await db.commit()
    await db.refresh(amb)
    return amb


@router.post("/calls", response_model=EmergencyCallResponse, status_code=status.HTTP_201_CREATED, summary="Log 907 Emergency Incident")
async def log_emergency_call(
    call_in: EmergencyCallCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmergencyCall:
    """Log incoming 907 community emergency call with field triage classification."""
    return await register_emergency_call(
        db,
        caller_name=call_in.caller_name,
        caller_phone=call_in.caller_phone,
        location_address=call_in.location_address,
        location_lat=call_in.location_lat,
        location_lon=call_in.location_lon,
        triage_level=call_in.triage_level,
        chief_complaint=call_in.chief_complaint,
    )


@router.post("/dispatch", response_model=EmergencyCallResponse, summary="Dispatch Ambulance to Incident")
async def dispatch_unit(
    req: DispatchAmbulanceRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EmergencyCall:
    """Dispatch ambulance unit and alert paramedic team."""
    try:
        return await dispatch_ambulance(db, incident_id=req.incident_id, ambulance_id=req.ambulance_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
