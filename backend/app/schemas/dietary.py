"""
Pydantic schemas for Dietary, Clinical Nutrition, and Ward Meal Distribution.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.dietary import DietOrderStatus, DietType, MealType


class DietOrderCreate(BaseModel):
    patient_id: int
    diet_type: DietType
    special_instructions: Optional[str] = None
    allergies_noted: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None


class DietOrderResponse(DietOrderCreate):
    id: int
    prescribed_by_id: int
    status: DietOrderStatus

    model_config = {"from_attributes": True}


class KitchenMealDeliveryCreate(BaseModel):
    diet_order_id: int
    delivery_date: date
    meal_type: MealType
    ward_name: str
    bed_number: str


class KitchenMealDeliveryResponse(KitchenMealDeliveryCreate):
    id: int
    is_prepared: bool
    is_delivered: bool
    delivered_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
