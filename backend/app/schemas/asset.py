"""
Pydantic schemas for Biomedical Equipment & Asset Management.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.asset import AssetCategory, AssetStatus, MaintenanceStatus, MaintenanceType


class BiomedicalAssetCreate(BaseModel):
    asset_tag: str
    name: str
    manufacturer: str
    model: str
    serial_number: str
    category: AssetCategory
    department: str
    room_number: str
    purchase_price_etb: float = Field(default=0.0, ge=0.0)
    installation_date: date
    warranty_expiry_date: Optional[date] = None
    ppm_interval_days: int = 90
    next_ppm_date: date


class BiomedicalAssetResponse(BiomedicalAssetCreate):
    id: int
    status: AssetStatus
    last_ppm_date: Optional[date] = None

    model_config = {"from_attributes": True}


class MaintenanceOrderCreate(BaseModel):
    asset_id: int
    maintenance_type: MaintenanceType
    issue_description: str
    scheduled_date: date
    assigned_engineer_id: Optional[int] = None
    cost_etb: float = Field(default=0.0, ge=0.0)


class MaintenanceOrderResponse(MaintenanceOrderCreate):
    id: int
    work_order_code: str
    status: MaintenanceStatus
    action_taken: Optional[str] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
