"""
Pydantic schemas for Dietary, Clinical Nutrition, and Ward Meal Distribution.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, model_validator

from app.models.dietary import DietOrderStatus, DietType, MealType


class DietOrderCreate(BaseModel):
    patient_id: int
    diet_type: DietType
    special_instructions: Optional[str] = None
    allergies_noted: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    meal_type: Optional[str] = None
    ward_name: Optional[str] = None
    room_number: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def set_defaults(cls, data: dict):
        if isinstance(data, dict):
            if "start_date" not in data or data["start_date"] is None:
                data["start_date"] = date.today()
        return data


class DietOrderResponse(DietOrderCreate):
    id: int
    prescribed_by_id: int
    status: DietOrderStatus

    model_config = {"from_attributes": True}


class KitchenMealDeliveryCreate(BaseModel):
    diet_order_id: int
    delivery_date: Optional[date] = None
    meal_type: Optional[MealType] = MealType.LUNCH
    ward_name: Optional[str] = "Inpatient Ward"
    bed_number: Optional[str] = "Bed 1"
    delivered_by: Optional[str] = "Kitchen Delivery Staff"
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def set_delivery_defaults(cls, data: dict):
        if isinstance(data, dict):
            if "delivery_date" not in data or data["delivery_date"] is None:
                data["delivery_date"] = date.today()
        return data


class KitchenMealDeliveryResponse(KitchenMealDeliveryCreate):
    id: int
    is_prepared: bool
    is_delivered: bool
    delivered_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
