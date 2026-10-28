"""
Mass Casualty Incident (MCI) & START Protocol Disaster Triage service.
Evaluates Simple Triage and Rapid Treatment (START) criteria and tallies disaster surge statistics.
"""
from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mci import (
    MassCasualtyIncident,
    MCICasualtyTag,
    MCIIncidentStatus,
    STARTTriageCategory,
)
from app.schemas.mci import MCICasualtyTagCreate, MCIStatsResponse


def calculate_start_triage(
    is_ambulatory: bool,
    is_breathing: bool,
    respiratory_rate: Optional[int],
    has_radial_pulse: bool,
    can_follow_commands: bool,
) -> STARTTriageCategory:
    """START Algorithm Decision Engine for Disaster First Responders."""
    if not is_breathing:
        return STARTTriageCategory.BLACK_DECEASED
    if is_ambulatory:
        return STARTTriageCategory.GREEN_MINOR
    if respiratory_rate and respiratory_rate > 30:
        return STARTTriageCategory.RED_IMMEDIATE
    if not has_radial_pulse:
        return STARTTriageCategory.RED_IMMEDIATE
    if not can_follow_commands:
        return STARTTriageCategory.RED_IMMEDIATE
    return STARTTriageCategory.YELLOW_DELAYED


async def tag_disaster_casualty(
    db: AsyncSession,
    tag_in: MCICasualtyTagCreate,
) -> MCICasualtyTag:
    """Assign color-coded disaster tag and route casualty to designated emergency bay."""
    prefix_map = {
        STARTTriageCategory.RED_IMMEDIATE: "RED",
        STARTTriageCategory.YELLOW_DELAYED: "YEL",
        STARTTriageCategory.GREEN_MINOR: "GRN",
        STARTTriageCategory.BLACK_DECEASED: "BLK",
    }
    prefix = prefix_map.get(tag_in.triage_category, "MCI")
    tag_num = f"MCI-{prefix}-{uuid.uuid4().hex[:4].upper()}"

    tag = MCICasualtyTag(
        tag_number=tag_num,
        **tag_in.model_dump(),
        tagged_at=datetime.now(timezone.utc),
    )
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


async def get_mci_incident_stats(
    db: AsyncSession,
    incident_id: int,
) -> MCIStatsResponse:
    """Retrieve casualty distribution breakdown by START color categories."""
    inc_res = await db.execute(select(MassCasualtyIncident).where(MassCasualtyIncident.id == incident_id))
    incident = inc_res.scalar_one_or_none()
    code = incident.incident_code if incident else f"MCI-{incident_id}"

    # Counts by category
    query = select(MCICasualtyTag.triage_category, func.count(MCICasualtyTag.id)).where(
        MCICasualtyTag.incident_id == incident_id
    ).group_by(MCICasualtyTag.triage_category)
    result = await db.execute(query)
    counts = dict(result.all())

    red = counts.get(STARTTriageCategory.RED_IMMEDIATE, 0)
    yellow = counts.get(STARTTriageCategory.YELLOW_DELAYED, 0)
    green = counts.get(STARTTriageCategory.GREEN_MINOR, 0)
    black = counts.get(STARTTriageCategory.BLACK_DECEASED, 0)

    return MCIStatsResponse(
        incident_code=code,
        total_tagged=red + yellow + green + black,
        red_immediate=red,
        yellow_delayed=yellow,
        green_minor=green,
        black_deceased=black,
    )
