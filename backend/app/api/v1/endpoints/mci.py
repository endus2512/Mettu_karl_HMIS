"""
Mass Casualty Incident (MCI) & START Protocol Disaster Triage Endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.mci import (
    MassCasualtyIncident,
    MCICasualtyTag,
    MCIIncidentStatus,
)
from app.models.user import User
from app.schemas.mci import (
    MCICasualtyTagCreate,
    MCICasualtyTagResponse,
    MCIIncidentCreate,
    MCIIncidentResponse,
    MCIStatsResponse,
)
from app.services.mci_service import get_mci_incident_stats, tag_disaster_casualty

router = APIRouter()


@router.post("/incidents", response_model=MCIIncidentResponse, status_code=status.HTTP_201_CREATED, summary="Declare Mass Casualty Incident")
async def declare_mci(
    incident_in: MCIIncidentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MassCasualtyIncident:
    """Declare hospital-wide disaster code and activate trauma surge capacity."""
    incident = MassCasualtyIncident(
        **incident_in.model_dump(),
        status=MCIIncidentStatus.ACTIVE,
        declared_at=datetime.now(timezone.utc),
    )
    db.add(incident)
    await db.commit()
    await db.refresh(incident)
    return incident


@router.get("/incidents", response_model=List[MCIIncidentResponse], summary="List MCI Incidents")
async def list_mci_incidents(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[MassCasualtyIncident]:
    """Retrieve active and historical mass casualty incident logs."""
    res = await db.execute(select(MassCasualtyIncident).order_by(MassCasualtyIncident.declared_at.desc()))
    return list(res.scalars().all())


@router.post("/tags", response_model=MCICasualtyTagResponse, status_code=status.HTTP_201_CREATED, summary="Assign START Triage Tag")
async def assign_casualty_tag(
    tag_in: MCICasualtyTagCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MCICasualtyTag:
    """Assign START disaster category tag and route casualty to treatment bay."""
    return await tag_disaster_casualty(db=db, tag_in=tag_in)


@router.get("/incidents/{incident_id}/stats", response_model=MCIStatsResponse, summary="Get Incident Triage Stats")
async def get_incident_stats(
    incident_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MCIStatsResponse:
    """Tally casualty breakdown by RED, YELLOW, GREEN, and BLACK categories."""
    return await get_mci_incident_stats(db=db, incident_id=incident_id)


@router.post("/incidents/{incident_id}/stand-down", response_model=MCIIncidentResponse, summary="Deactivate Disaster Protocol")
async def stand_down_mci(
    incident_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MassCasualtyIncident:
    """Conclude disaster response and transition hospital to normal operations."""
    res = await db.execute(select(MassCasualtyIncident).where(MassCasualtyIncident.id == incident_id))
    incident = res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    incident.status = MCIIncidentStatus.STAND_DOWN
    incident.closed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(incident)
    return incident
