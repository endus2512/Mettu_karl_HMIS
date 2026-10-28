"""
Pharmacy, inventory batching, and FEFO dispensing service.
"""
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pharmacy import (
    Drug,
    DrugBatch,
    MovementType,
    Prescription,
    PrescriptionItem,
    PrescriptionStatus,
    StockMovement,
)
from app.schemas.pharmacy import StockAlert


async def get_fefo_batches_for_drug(db: AsyncSession, drug_id: int) -> List[DrugBatch]:
    """
    Retrieve active stock batches sorted by Earliest Expiry Date (FEFO).
    Filters out zero quantity and expired batches.
    """
    today = date.today()
    stmt = (
        select(DrugBatch)
        .where(
            DrugBatch.drug_id == drug_id,
            DrugBatch.current_quantity > 0,
            DrugBatch.expiry_date >= today,
        )
        .order_by(DrugBatch.expiry_date.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def dispense_prescription_item(
    db: AsyncSession,
    item: PrescriptionItem,
    dispense_quantity: int,
    user_id: Optional[int] = None,
) -> bool:
    """
    Dispense medication for an item using FEFO batches.
    Decrements batch inventory and logs stock movements.
    """
    remaining = dispense_quantity
    fefo_batches = await get_fefo_batches_for_drug(db, item.drug_id)

    for batch in fefo_batches:
        if remaining <= 0:
            break

        take_qty = min(remaining, batch.current_quantity)
        batch.current_quantity -= take_qty
        remaining -= take_qty

        # Record stock movement
        movement = StockMovement(
            drug_id=item.drug_id,
            batch_id=batch.id,
            movement_type=MovementType.DISPENSE,
            quantity=-take_qty,
            balance_after=batch.current_quantity,
            reference_number=f"Rx-{item.prescription_id}",
            user_id=user_id,
        )
        db.add(movement)
        item.batch_id = batch.id

    item.quantity_dispensed += (dispense_quantity - remaining)
    await db.commit()
    return remaining == 0


async def check_inventory_alerts(db: AsyncSession) -> List[StockAlert]:
    """
    Scan pharmacy stock for:
    1. Low stock items (total across batches <= reorder_level)
    2. Expiring soon batches (within next 90 days)
    3. Already expired batches
    """
    alerts: List[StockAlert] = []
    today = date.today()
    ninety_days = today + timedelta(days=90)

    # 1. Low stock query
    stmt_drugs = select(Drug).where(Drug.is_active.is_(True))
    drugs_res = await db.execute(stmt_drugs)
    all_drugs = list(drugs_res.scalars().all())

    for drug in all_drugs:
        # Sum current quantity
        qty_stmt = select(func.coalesce(func.sum(DrugBatch.current_quantity), 0)).where(
            DrugBatch.drug_id == drug.id,
            DrugBatch.expiry_date >= today,
        )
        qty_res = await db.execute(qty_stmt)
        total_qty = qty_res.scalar_one()

        if total_qty <= drug.reorder_level:
            alerts.append(
                StockAlert(
                    drug_id=drug.id,
                    drug_name=drug.name,
                    generic_name=drug.generic_name,
                    alert_type="LOW_STOCK",
                    message=f"Stock low ({total_qty} units left; reorder threshold is {drug.reorder_level})",
                    total_quantity=total_qty,
                )
            )

    # 2. Expiring soon query
    exp_stmt = (
        select(DrugBatch, Drug)
        .join(Drug, Drug.id == DrugBatch.drug_id)
        .where(
            DrugBatch.current_quantity > 0,
            DrugBatch.expiry_date <= ninety_days,
            DrugBatch.expiry_date >= today,
        )
    )
    exp_res = await db.execute(exp_stmt)
    for batch, drug in exp_res.all():
        alerts.append(
            StockAlert(
                drug_id=drug.id,
                drug_name=drug.name,
                generic_name=drug.generic_name,
                alert_type="EXPIRING_SOON",
                message=f"Batch {batch.batch_number} expires on {batch.expiry_date} ({batch.current_quantity} units)",
                total_quantity=batch.current_quantity,
                expiry_date=batch.expiry_date,
            )
        )

    # 3. Already expired query
    expired_stmt = (
        select(DrugBatch, Drug)
        .join(Drug, Drug.id == DrugBatch.drug_id)
        .where(
            DrugBatch.current_quantity > 0,
            DrugBatch.expiry_date < today,
        )
    )
    expired_res = await db.execute(expired_stmt)
    for batch, drug in expired_res.all():
        alerts.append(
            StockAlert(
                drug_id=drug.id,
                drug_name=drug.name,
                generic_name=drug.generic_name,
                alert_type="EXPIRED",
                message=f"CRITICAL: Batch {batch.batch_number} expired on {batch.expiry_date} and must be quarantined!",
                total_quantity=batch.current_quantity,
                expiry_date=batch.expiry_date,
            )
        )

    return alerts
