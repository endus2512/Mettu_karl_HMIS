"""
Pydantic schemas for Hospital Supply Chain, Tenders, Vendor Bids, and Purchase Orders.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.procurement import BidStatus, TenderStatus


class HospitalTenderCreate(BaseModel):
    tender_number: str
    title: str
    category: str
    estimated_budget_etb: float = Field(..., gt=0.0)
    submission_deadline: date
    specifications_summary: str


class HospitalTenderResponse(HospitalTenderCreate):
    id: int
    status: TenderStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class VendorBidCreate(BaseModel):
    tender_id: int
    vendor_name: str
    vendor_tin: str
    contact_email: EmailStr
    quoted_amount_etb: float = Field(..., gt=0.0)
    delivery_timeline_days: int = 30


class VendorBidResponse(VendorBidCreate):
    id: int
    technical_score: Optional[float] = None
    status: BidStatus
    submitted_at: datetime

    model_config = {"from_attributes": True}


class PurchaseOrderCreate(BaseModel):
    tender_id: Optional[int] = None
    vendor_name: str
    total_amount_etb: float = Field(..., gt=0.0)
    issued_date: date
    delivery_deadline: date


class PurchaseOrderResponse(PurchaseOrderCreate):
    id: int
    po_number: str
    is_approved: bool

    model_config = {"from_attributes": True}
