"""
Dietary, Hospital Kitchen, and Clinical Nutrition endpoints.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.dietary import DietOrder, DietOrderStatus, KitchenMealDelivery
from app.models.user import User
from app.schemas.dietary import (
    DietOrderCreate,
    DietOrderResponse,
    KitchenMealDeliveryCreate,
    KitchenMealDeliveryResponse,
)

router = APIRouter()


@router.post("/orders", response_model=DietOrderResponse, status_code=status.HTTP_201_CREATED, summary="Prescribe Clinical Diet Order")
async def create_diet_order(
    order_in: DietOrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> DietOrder:
    """Doctor or Clinical Nutritionist prescribes a customized inpatient diet."""
    order = DietOrder(
        patient_id=order_in.patient_id,
        diet_type=order_in.diet_type,
        special_instructions=order_in.special_instructions,
        allergies_noted=order_in.allergies_noted,
        prescribed_by_id=current_user.id,
        start_date=order_in.start_date,
        end_date=order_in.end_date,
        status=DietOrderStatus.ACTIVE,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/orders", response_model=List[DietOrderResponse], summary="List Inpatient Diet Orders")
async def list_diet_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    patient_id: Optional[int] = None,
) -> List[DietOrder]:
    """Retrieve active clinical diet orders for kitchen meal production."""
    query = select(DietOrder).where(DietOrder.status == DietOrderStatus.ACTIVE)
    if patient_id:
        query = query.where(DietOrder.patient_id == patient_id)
    res = await db.execute(query)
    return list(res.scalars().all())


@router.post("/deliveries", response_model=KitchenMealDeliveryResponse, status_code=status.HTTP_201_CREATED, summary="Record Ward Meal Delivery")
async def record_delivery(
    deliv_in: KitchenMealDeliveryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> KitchenMealDelivery:
    """Kitchen records prepared meal delivery dispatched to inpatient ward."""
    delivery = KitchenMealDelivery(
        diet_order_id=deliv_in.diet_order_id,
        delivery_date=deliv_in.delivery_date,
        meal_type=deliv_in.meal_type,
        ward_name=deliv_in.ward_name,
        bed_number=deliv_in.bed_number,
        is_prepared=True,
        is_delivered=True,
    )
    db.add(delivery)
    await db.commit()
    await db.refresh(delivery)
    return delivery
