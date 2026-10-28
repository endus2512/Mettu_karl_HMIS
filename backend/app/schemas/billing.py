"""
Pydantic schemas for Billing, Telebirr integration, and CBHI Insurance.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.billing import InvoiceStatus, PaymentMethod, PaymentStatus


class InvoiceItemCreate(BaseModel):
    service_name: str
    service_code: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., ge=0.0)


class InvoiceItemResponse(InvoiceItemCreate):
    id: int
    total_price: float

    model_config = {"from_attributes": True}


class InvoiceCreate(BaseModel):
    patient_id: int
    items: List[InvoiceItemCreate]
    apply_cbhi: bool = False
    notes: Optional[str] = None


class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float = Field(..., gt=0.0)
    payment_method: PaymentMethod
    payer_phone: Optional[str] = None
    transaction_reference: Optional[str] = None


class TelebirrPaymentRequest(BaseModel):
    invoice_id: int
    phone_number: str = Field(..., description="Customer Telebirr mobile number (e.g. 251911XXXXXX)")


class TelebirrPaymentResponse(BaseModel):
    checkout_url: str
    transaction_reference: str
    status: str = "initiated"


class TelebirrWebhookPayload(BaseModel):
    outTradeNo: str
    tradeNo: str
    totalAmount: str
    tradeStatus: str
    sign: str


class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    amount: float
    payment_method: PaymentMethod
    transaction_reference: str
    status: PaymentStatus
    payer_phone: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    patient_id: int
    total_amount: float
    insurance_covered_amount: float
    patient_payable_amount: float
    paid_amount: float
    status: InvoiceStatus
    notes: Optional[str] = None
    created_at: datetime
    items: List[InvoiceItemResponse] = []
    payments: List[PaymentResponse] = []

    model_config = {"from_attributes": True}
