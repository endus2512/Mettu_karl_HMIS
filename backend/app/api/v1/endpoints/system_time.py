"""
Hospital Online Time Synchronization, Ethiopian Calendar, and Shift Management Endpoints.
Ensures time, calendar, and shifts are synchronized online via the central database rather than client-local state.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.schemas.system_time import (
    ShiftOverrideRequest,
    ShiftRosterOverviewResponse,
    TimeSyncResponse,
)
from app.services.system_time_service import (
    get_active_ward_roster,
    get_online_time_sync,
    get_or_create_shift_config,
    override_shift_config,
)

router = APIRouter()


@router.get(
    "/time-sync",
    response_model=TimeSyncResponse,
    summary="Get Synchronized Server Time, Ethiopian Calendar, and Active Shift",
)
async def get_system_time_sync(
    db: AsyncSession = Depends(get_db),
) -> TimeSyncResponse:
    """
    Online Hospital Time Sync Endpoint.
    Returns:
    - Accurate Server Time in East Africa Time (EAT UTC+3).
    - Ethiopian Calendar Date (Month, Day, Year in Afaan Oromoo, Amharic, English).
    - Habasha Time (12-hour offset sunrise-based time).
    - Active Shift (Morning, Afternoon, Night, On-Call).
    - Shift Progress Percentage & Handover Countdown in minutes.
    - Active Charge Nurse and Duty Physician on record.
    """
    return await get_online_time_sync(db)


@router.post(
    "/shifts/override",
    response_model=TimeSyncResponse,
    summary="Update or Override Hospital Shift and Handover Notes (Online Persisted)",
)
async def override_hospital_shift(
    override_in: ShiftOverrideRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TimeSyncResponse:
    """
    Persist shift change, charge nurse, on-duty physician, or handover notes to database.
    Permitted for ADMIN, SUPER_ADMIN, DOCTOR, and NURSE (Charge Nurse).
    """
    allowed_roles = [
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.DOCTOR,
        UserRole.NURSE,
    ]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shift and calendar configuration is restricted to clinical leadership and administrators.",
        )

    user_label = f"{current_user.full_name} ({current_user.role.value})"
    return await override_shift_config(db, override_in, user_label)


@router.post(
    "/shifts/reset-auto",
    response_model=TimeSyncResponse,
    summary="Reset Shift Determination to Automatic Hospital Server Time",
)
async def reset_auto_shift(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TimeSyncResponse:
    """Reset active shift calculation to follow automatic server time."""
    config = await get_or_create_shift_config(db)
    config.is_auto = True
    config.updated_by = f"{current_user.full_name} ({current_user.role.value})"
    await db.commit()
    await db.refresh(config)
    return await get_online_time_sync(db)


@router.get(
    "/shifts/roster",
    response_model=ShiftRosterOverviewResponse,
    summary="Get Active Clinical Shift Roster for Wards and Nursing Stations",
)
async def get_shift_roster(
    db: AsyncSession = Depends(get_db),
) -> ShiftRosterOverviewResponse:
    """Get active clinical duty roster for on-duty nurses, midwives, and physicians."""
    time_data = await get_online_time_sync(db)
    return get_active_ward_roster(time_data.shift.type)
