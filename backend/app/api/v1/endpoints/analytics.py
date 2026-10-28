"""
Executive Business Intelligence and Hospital Performance Analytics endpoints.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import ExecutiveSummaryResponse
from app.services.analytics_service import get_executive_summary

router = APIRouter()


@router.get("/executive-summary", response_model=ExecutiveSummaryResponse, summary="Get Hospital Executive BI Summary")
async def get_hospital_executive_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ExecutiveSummaryResponse:
    """
    Hospital leadership BI dashboard endpoint.
    Aggregates:
    - Bed occupancy & admissions
    - OPD triage volume
    - Daily gross revenue (Telebirr, Cash, CBHI insurance claims)
    - Pharmacy stock alert counters
    """
    return await get_executive_summary(db)
