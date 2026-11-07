"""
Pydantic schemas for Billing, Telebirr integration, and CBHI Insurance.
"""
from datetime import date, datetime
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
    notes: Optional[str] = None


class CashierPaymentRequest(BaseModel):
    invoice_id: int
    amount: Optional[float] = None  # None = pay remaining balance
    payment_method: PaymentMethod = PaymentMethod.CASH
    payer_phone: Optional[str] = None
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None


class TelebirrPaymentRequest(BaseModel):
    invoice_id: int
    phone_number: str = Field(..., description="Customer Telebirr mobile number (e.g. 0911002233)")


class TelebirrPaymentResponse(BaseModel):
    checkout_url: str
    transaction_reference: str
    status: str = "initiated"
    qr_data: str
    amount: float


class TelebirrConfirmRequest(BaseModel):
    transaction_reference: str
    customer_pin: Optional[str] = None


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
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PatientBillingBrief(BaseModel):
    id: int
    mrn: str
    first_name: str
    last_name: str
    gender: str
    phone_number: Optional[str] = None
    has_cbhi: bool = False
    cbhi_household: Optional[str] = None
    cbhi_copay_rate: float = 0.0


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    patient_id: int
    patient: Optional[PatientBillingBrief] = None
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


class RevenueSummaryResponse(BaseModel):
    today_total_revenue: float
    today_telebirr_revenue: float
    today_cash_revenue: float
    today_cbe_revenue: float
    today_cbhi_claims: float
    pending_invoices_count: int
    paid_invoices_count: int
    total_invoices_count: int
    collection_rate_percentage: float


class CBHIPolicyCreate(BaseModel):
    patient_id: int
    household_number: str
    kebele: str
    woreda: str = "Mettu"
    expiry_date: date
    co_pay_percentage: float = 0.0


class CBHIPolicyResponse(CBHIPolicyCreate):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}

