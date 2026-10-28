"""
Hospital Physical Resilience: Grid, Dual Generators & Solar Microgrid Endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.power_grid import HospitalPowerTelemetry, PowerSourceType
from app.models.user import User, UserRole
from app.schemas.power_grid import (
    PowerGridSummary,
    PowerTelemetryCreate,
    PowerTelemetryResponse,
)
from app.services.power_service import evaluate_power_grid_state

router = APIRouter()

technician_guard = require_roles(UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN)


@router.post("/telemetry", response_model=PowerTelemetryResponse, status_code=status.HTTP_201_CREATED, summary="Ingest Facility Power Telemetry")
async def ingest_power_telemetry(
    telemetry_in: PowerTelemetryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(technician_guard)],
) -> HospitalPowerTelemetry:
    """Ingest power sensor telemetry from EEU grid, Cummins generators, ATS, and solar PV."""
    telemetry = HospitalPowerTelemetry(
        **telemetry_in.model_dump(),
        timestamp=datetime.now(timezone.utc),
    )
    db.add(telemetry)
    await db.commit()
    await db.refresh(telemetry)
    return telemetry


@router.get("/summary", response_model=PowerGridSummary, summary="Get Hospital Power Resilience Summary")
async def get_power_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PowerGridSummary:
    """Retrieve operational state of grid utility, dual backup generators, ATS, and solar batteries."""
    res = await db.execute(select(HospitalPowerTelemetry).order_by(HospitalPowerTelemetry.timestamp.desc()).limit(1))
    latest = res.scalar_one_or_none()
    
    if not latest:
        # Default nominal state if no telemetry posted yet
        latest = HospitalPowerTelemetry(
            active_source=PowerSourceType.EEU_GRID,
            eeu_grid_online=True,
            eeu_grid_voltage=380.0,
            gen1_running=False,
            gen1_fuel_percent=88.0,
            gen2_running=False,
            gen2_fuel_percent=94.0,
            solar_battery_soc_percent=95.0,
            total_hospital_load_kw=142.0,
            server_room_ups_soc_percent=100.0,
            cold_chain_alarm=False,
        )

    return evaluate_power_grid_state(latest)
