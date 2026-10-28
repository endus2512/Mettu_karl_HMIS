"""
Biomedical Asset & Maintenance management service.
Handles preventive maintenance (PPM) scheduling, calibration tracking, and work orders.
"""
from datetime import date, timedelta
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import (
    AssetStatus,
    BiomedicalAsset,
    MaintenanceOrder,
    MaintenanceStatus,
    MaintenanceType,
)


async def check_ppm_due_assets(db: AsyncSession, days_ahead: int = 30) -> List[BiomedicalAsset]:
    """Identify medical equipment due for calibration or preventive maintenance within N days."""
    target_date = date.today() + timedelta(days=days_ahead)
    stmt = (
        select(BiomedicalAsset)
        .where(
            BiomedicalAsset.status.in_([AssetStatus.OPERATIONAL, AssetStatus.MAINTENANCE_REQUIRED]),
            BiomedicalAsset.next_ppm_date <= target_date,
        )
        .order_by(BiomedicalAsset.next_ppm_date.asc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def create_maintenance_work_order(
    db: AsyncSession,
    asset_id: int,
    maintenance_type: MaintenanceType,
    issue_description: str,
    scheduled_date: date,
    assigned_engineer_id: Optional[int] = None,
    cost_etb: float = 0.0,
) -> MaintenanceOrder:
    """Create and assign an engineering work order for an asset."""
    code = f"WO-{uuid.uuid4().hex[:8].upper()}"

    order = MaintenanceOrder(
        work_order_code=code,
        asset_id=asset_id,
        maintenance_type=maintenance_type,
        status=MaintenanceStatus.SCHEDULED,
        issue_description=issue_description,
        scheduled_date=scheduled_date,
        assigned_engineer_id=assigned_engineer_id,
        cost_etb=cost_etb,
    )
    db.add(order)

    # If corrective breakdown, update asset status to MAINTENANCE_REQUIRED
    if maintenance_type == MaintenanceType.CORRECTIVE:
        asset_stmt = select(BiomedicalAsset).where(BiomedicalAsset.id == asset_id)
        asset_res = await db.execute(asset_stmt)
        asset = asset_res.scalar_one_or_none()
        if asset:
            asset.status = AssetStatus.MAINTENANCE_REQUIRED

    await db.commit()
    await db.refresh(order)
    return order
