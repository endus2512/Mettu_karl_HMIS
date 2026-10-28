"""
Blood Bank, Donor Registry, and Crossmatch testing endpoints.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.blood_bank import BloodGroup, BloodUnit, CrossMatch
from app.models.user import User
from app.schemas.blood_bank import (
    BloodGroupStock,
    BloodUnitCreate,
    BloodUnitResponse,
    CrossMatchRequest,
    CrossMatchResponse,
)
from app.services.blood_bank_service import (
    get_blood_bank_stock_summary,
    perform_crossmatch,
)

router = APIRouter()


@router.get("/stock-summary", response_model=List[BloodGroupStock], summary="Blood Bank Real-Time Inventory Summary")
async def get_stock_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[BloodGroupStock]:
    """Retrieve available blood unit counts by blood group with critical shortage alerts."""
    return await get_blood_bank_stock_summary(db)


@router.post("/units", response_model=BloodUnitResponse, status_code=status.HTTP_201_CREATED, summary="Receive Blood Unit")
async def add_blood_unit(
    unit_in: BloodUnitCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> BloodUnit:
    """Register screened and labeled blood unit into cold storage."""
    unit = BloodUnit(**unit_in.model_dump())
    db.add(unit)
    await db.commit()
    await db.refresh(unit)
    return unit


@router.post("/crossmatch", response_model=CrossMatchResponse, status_code=status.HTTP_201_CREATED, summary="Record Crossmatch Test")
async def record_crossmatch(
    cm_in: CrossMatchRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CrossMatch:
    """Record compatibility testing between patient blood sample and donor unit."""
    return await perform_crossmatch(
        db,
        patient_id=cm_in.patient_id,
        blood_unit_id=cm_in.blood_unit_id,
        is_compatible=cm_in.is_compatible,
        technologist_id=current_user.id,
        notes=cm_in.notes,
    )
