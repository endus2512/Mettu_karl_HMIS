"""
Blood Bank inventory, component shelf life, and crossmatching service.
"""
from datetime import datetime, timezone
from typing import Dict, List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blood_bank import (
    BloodGroup,
    BloodUnit,
    BloodUnitStatus,
    ComponentType,
    CrossMatch,
)
from app.schemas.blood_bank import BloodGroupStock


async def get_blood_bank_stock_summary(db: AsyncSession) -> List[BloodGroupStock]:
    """Calculate real-time unexpired blood unit counts across all blood groups."""
    now = datetime.now(timezone.utc)
    summary: List[BloodGroupStock] = []

    for bg in BloodGroup:
        stmt = select(BloodUnit).where(
            BloodUnit.blood_group == bg,
            BloodUnit.status == BloodUnitStatus.AVAILABLE,
            BloodUnit.expiry_date > now,
        )
        res = await db.execute(stmt)
        units = list(res.scalars().all())

        prbc = sum(1 for u in units if u.component_type == ComponentType.PACKED_RBC)
        plasma = sum(1 for u in units if u.component_type == ComponentType.FRESH_FROZEN_PLASMA)
        platelets = sum(1 for u in units if u.component_type == ComponentType.PLATELETS)
        total = len(units)

        # Critical shortage if less than 3 units of a blood group (especially O- negative)
        is_short = total < (5 if bg == BloodGroup.O_NEG else 3)

        summary.append(
            BloodGroupStock(
                blood_group=bg,
                total_units=total,
                prbc_units=prbc,
                plasma_units=plasma,
                platelet_units=platelets,
                is_critical_shortage=is_short,
            )
        )

    return summary


async def perform_crossmatch(
    db: AsyncSession,
    patient_id: int,
    blood_unit_id: int,
    is_compatible: bool,
    technologist_id: int,
    notes: str = None,
) -> CrossMatch:
    """Record serological crossmatch compatibility between patient and donor unit."""
    cm = CrossMatch(
        patient_id=patient_id,
        blood_unit_id=blood_unit_id,
        is_compatible=is_compatible,
        technologist_id=technologist_id,
        notes=notes,
    )
    db.add(cm)

    # If compatible, reserve the blood unit
    if is_compatible:
        stmt = select(BloodUnit).where(BloodUnit.id == blood_unit_id)
        res = await db.execute(stmt)
        unit = res.scalar_one_or_none()
        if unit and unit.status == BloodUnitStatus.AVAILABLE:
            unit.status = BloodUnitStatus.RESERVED

    await db.commit()
    await db.refresh(cm)
    return cm
