"""
Executive Business Intelligence and Hospital Performance Analytics endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import ExecutiveSummaryResponse
from app.services.analytics_service import (
    build_executive_summary_csv,
    get_executive_summary,
)

router = APIRouter()

TimeRangeQuery = Literal["today", "week", "month", "quarter"]


@router.get(
    "/executive-summary",
    response_model=ExecutiveSummaryResponse,
    summary="Get Hospital Executive BI Summary",
)
async def get_hospital_executive_summary(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    time_range: TimeRangeQuery = Query(
        default="month",
        description="Aggregation window: today, week, month, or quarter",
    ),
) -> ExecutiveSummaryResponse:
    """
    Hospital leadership BI dashboard endpoint.
    Dynamically aggregates live metrics from the database:
    - Registered patients & period growth
    - Live ward bed occupancy & admissions
    - OPD triage & department workload
    - Gross revenue (Telebirr, Cash, CBHI insurance claims)
    - OT surgeries, Lab orders, HAI/SSI surveillance & EHSTG quality indicators
    - Pharmacy stock alert counters
    """
    return await get_executive_summary(db, time_range=time_range)


@router.get(
    "/executive-summary/export",
    summary="Export Hospital Executive MoH KPI Summary as CSV",
)
async def export_hospital_executive_summary_csv(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    time_range: TimeRangeQuery = Query(
        default="month",
        description="Aggregation window: today, week, month, or quarter",
    ),
) -> Response:
    """Download real live MoH / EHSTG KPI report as an RFC-4180 CSV file."""
    summary = await get_executive_summary(db, time_range=time_range)
    csv_content = build_executive_summary_csv(summary)
    date_stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    filename = f"mettu-karl-moh-kpi-{time_range}-{date_stamp}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )
