"""
Billing, Payments, Telebirr API, and CBHI Insurance endpoints.
"""
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_user, require_roles
from app.core.audit import record_audit_event
from app.core.database import get_db
from app.models.billing import (
    CBHIPolicy,
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    Payment,
    PaymentMethod,
    PaymentStatus,
)
from app.models.user import User, UserRole

billing_guard = require_roles(UserRole.BILLING, UserRole.ADMIN, UserRole.INSURANCE_OFFICER, UserRole.SUPER_ADMIN)
from app.schemas.billing import (
    InvoiceCreate,
    InvoiceResponse,
    PaymentCreate,
    PaymentResponse,
    TelebirrPaymentRequest,
    TelebirrPaymentResponse,
    TelebirrWebhookPayload,
)
from app.services.telebirr_service import telebirr_service

router = APIRouter()


@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED, summary="Create Invoice")
async def create_invoice(
    invoice_in: InvoiceCreate,
    request: Request,
    current_user: Annotated[User, Depends(billing_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Invoice:
    """Create a new itemized patient invoice with optional CBHI co-pay deduction."""
    subtotal = sum(item.unit_price * item.quantity for item in invoice_in.items)
    covered_amount = 0.0
    patient_payable = subtotal

    # Apply CBHI insurance policy if requested
    if invoice_in.apply_cbhi:
        policy_stmt = select(CBHIPolicy).where(
            CBHIPolicy.patient_id == invoice_in.patient_id,
            CBHIPolicy.is_active.is_(True),
        )
        policy_res = await db.execute(policy_stmt)
        policy = policy_res.scalar_one_or_none()

        if policy:
            copay_rate = policy.co_pay_percentage / 100.0
            patient_payable = subtotal * copay_rate
            covered_amount = subtotal - patient_payable

    invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"

    invoice = Invoice(
        invoice_number=invoice_number,
        patient_id=invoice_in.patient_id,
        total_amount=subtotal,
        insurance_covered_amount=covered_amount,
        patient_payable_amount=patient_payable,
        paid_amount=0.0,
        status=InvoiceStatus.PENDING,
        notes=invoice_in.notes,
    )
    db.add(invoice)
    await db.flush()

    # Add items
    for item_data in invoice_in.items:
        item = InvoiceItem(
            invoice_id=invoice.id,
            service_name=item_data.service_name,
            service_code=item_data.service_code,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=item_data.unit_price * item_data.quantity,
        )
        db.add(item)

    await db.commit()
    await db.refresh(invoice)

    await record_audit_event(
        db,
        user_id=current_user.id,
        action="INVOICE_CREATE",
        resource="Invoice",
        resource_id=invoice.invoice_number,
        ip_address=get_client_ip(request),
        result="success",
        detail={"total": subtotal, "patient_payable": patient_payable},
    )

    return invoice


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse, summary="Get Invoice Details")
async def get_invoice(
    invoice_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Invoice:
    """Fetch invoice by ID with line items and payment transactions."""
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    res = await db.execute(stmt)
    invoice = res.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    return invoice


@router.post("/telebirr/pay", response_model=TelebirrPaymentResponse, summary="Initiate Telebirr Payment")
async def initiate_telebirr_payment(
    req_data: TelebirrPaymentRequest,
    current_user: Annotated[User, Depends(billing_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TelebirrPaymentResponse:
    """Trigger Telebirr push payment / web checkout URL."""
    stmt = select(Invoice).where(Invoice.id == req_data.invoice_id)
    res = await db.execute(stmt)
    invoice = res.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invoice is already fully paid")

    checkout_url, ref = await telebirr_service.initiate_payment(
        db,
        invoice=invoice,
        customer_phone=req_data.phone_number,
    )

    return TelebirrPaymentResponse(
        checkout_url=checkout_url,
        transaction_reference=ref,
        status="initiated",
    )


@router.post("/telebirr/webhook", summary="Telebirr Asynchronous Webhook")
async def telebirr_webhook(
    payload: TelebirrWebhookPayload,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Process instant payment callback from Ethio Telecom Telebirr servers."""
    if payload.tradeStatus == "Completed":
        paid_amount = float(payload.totalAmount)
        await telebirr_service.process_payment_success(
            db,
            transaction_reference=payload.outTradeNo,
            paid_amount=paid_amount,
        )

    return {"code": 0, "message": "success"}
