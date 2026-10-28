"""
Medical Waste Management, Segregation, and Incineration Endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.waste import IncineratorBatch, MedicalWasteLog, WasteCategory
from app.schemas.waste import (
    IncineratorBatchCreate,
    IncineratorBatchResponse,
    MedicalWasteLogCreate,
    MedicalWasteLogResponse,
)

router = APIRouter()


@router.post("/logs", response_model=MedicalWasteLogResponse, status_code=status.HTTP_201_CREATED, summary="Log Medical Waste Collection")
async def log_medical_waste(
    waste_in: MedicalWasteLogCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MedicalWasteLog:
    """Log segregated biomedical waste (Yellow, Red, Brown, Black) from ward or OT."""
    waste_code = f"MW-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    waste_log = MedicalWasteLog(
        waste_code=waste_code,
        **waste_in.model_dump(),
        collected_at=datetime.now(timezone.utc),
    )
    db.add(waste_log)
    await db.commit()
    await db.refresh(waste_log)
    return waste_log


@router.get("/logs", response_model=List[MedicalWasteLogResponse], summary="List Medical Waste Logs")
async def list_medical_waste(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    category: Optional[WasteCategory] = Query(None, description="Filter by color-coded waste category"),
    department: Optional[str] = Query(None, description="Filter by originating department"),
) -> List[MedicalWasteLog]:
    """Retrieve hospital hazardous and non-hazardous waste audit logs."""
    query = select(MedicalWasteLog).order_by(MedicalWasteLog.collected_at.desc())
    if category:
        query = query.where(MedicalWasteLog.category == category)
    if department:
        query = query.where(MedicalWasteLog.department == department)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/incinerator/batches", response_model=IncineratorBatchResponse, status_code=status.HTTP_201_CREATED, summary="Log Incinerator Batch Burn")
async def log_incinerator_batch(
    batch_in: IncineratorBatchCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> IncineratorBatch:
    """Log thermal disposal cycle in high-temperature dual-chamber incinerator."""
    batch_code = f"INC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    batch = IncineratorBatch(
        batch_code=batch_code,
        **batch_in.model_dump(),
        emission_scrubber_normal=True,
        burned_at=datetime.now(timezone.utc),
    )
    db.add(batch)
    await db.commit()
    await db.refresh(batch)
    return batch


@router.get("/incinerator/batches", response_model=List[IncineratorBatchResponse], summary="List Incineration Cycles")
async def list_incinerator_batches(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[IncineratorBatch]:
    """Retrieve thermal treatment compliance logs for environmental safety oversight."""
    result = await db.execute(select(IncineratorBatch).order_by(IncineratorBatch.burned_at.desc()))
    return list(result.scalars().all())
