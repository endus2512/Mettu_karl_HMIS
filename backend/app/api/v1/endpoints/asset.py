"""
Biomedical Asset & Preventive Maintenance endpoints.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.asset import BiomedicalAsset, MaintenanceOrder
from app.models.user import User, UserRole
from app.schemas.asset import (
    BiomedicalAssetCreate,
    BiomedicalAssetResponse,
    MaintenanceOrderCreate,
    MaintenanceOrderResponse,
)
from app.services.asset_service import check_ppm_due_assets, create_maintenance_work_order

router = APIRouter()

technician_guard = require_roles(UserRole.TECHNICIAN, UserRole.LAB_TECH, UserRole.ADMIN, UserRole.SUPER_ADMIN)


@router.get("/biomedical", response_model=List[BiomedicalAssetResponse], summary="List Biomedical Equipment")
async def list_assets(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(technician_guard)],
    department: Optional[str] = None,
) -> List[BiomedicalAsset]:
    """Retrieve hospital capital biomedical assets with location and status."""
    query = select(BiomedicalAsset)
    if department:
        query = query.where(BiomedicalAsset.department == department)
    res = await db.execute(query)
    return list(res.scalars().all())


@router.post("/biomedical", response_model=BiomedicalAssetResponse, status_code=status.HTTP_201_CREATED, summary="Register Medical Device")
async def register_asset(
    asset_in: BiomedicalAssetCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(technician_guard)],
) -> BiomedicalAsset:
    """Add a new medical asset to the biomedical registry."""
    asset = BiomedicalAsset(**asset_in.model_dump())
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.get("/alerts/ppm-due", response_model=List[BiomedicalAssetResponse], summary="Get Calibration / PPM Due Alerts")
async def get_ppm_due_alerts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(technician_guard)],
    days_ahead: int = Query(30, ge=1, le=90),
) -> List[BiomedicalAsset]:
    """Scan assets requiring calibration or maintenance in the next N days."""
    return await check_ppm_due_assets(db, days_ahead=days_ahead)


@router.post("/work-orders", response_model=MaintenanceOrderResponse, status_code=status.HTTP_201_CREATED, summary="Create Maintenance Work Order")
async def create_work_order(
    order_in: MaintenanceOrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(technician_guard)],
) -> MaintenanceOrder:
    """Issue corrective repair or scheduled PPM work order to biomedical engineering."""
    return await create_maintenance_work_order(
        db,
        asset_id=order_in.asset_id,
        maintenance_type=order_in.maintenance_type,
        issue_description=order_in.issue_description,
        scheduled_date=order_in.scheduled_date,
        assigned_engineer_id=order_in.assigned_engineer_id,
        cost_etb=order_in.cost_etb,
    )
