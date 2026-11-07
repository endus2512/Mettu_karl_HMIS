"""
Billing, Payments, Telebirr API, and CBHI Insurance endpoints.
"""
from datetime import date, datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_user, require_roles_flexible
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
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.schemas.billing import (
    CBHIPolicyCreate,
    CBHIPolicyResponse,
    CashierPaymentRequest,
    InvoiceCreate,
    InvoiceItemResponse,
    InvoiceResponse,
    PatientBillingBrief,
    PaymentCreate,
    PaymentResponse,
    RevenueSummaryResponse,
    TelebirrConfirmRequest,
    TelebirrPaymentRequest,
    TelebirrPaymentResponse,
    TelebirrWebhookPayload,
)
from app.services.telebirr_service import telebirr_service

billing_guard = require_roles_flexible(
    UserRole.BILLING,
    UserRole.ADMIN,
    UserRole.INSURANCE_OFFICER,
    UserRole.RECEPTIONIST,
    UserRole.SUPER_ADMIN,
)

router = APIRouter()


async def _enrich_invoice_response(db: AsyncSession, invoice: Invoice) -> InvoiceResponse:
    """Helper to populate nested patient, items, and payments for InvoiceResponse."""
    # Fetch Patient
    pat_stmt = select(Patient).where(Patient.id == invoice.patient_id)
    pat = (await db.execute(pat_stmt)).scalar_one_or_none()

    patient_brief = None
    if pat:
        # Check active CBHI policy
        cbhi_stmt = select(CBHIPolicy).where(
            CBHIPolicy.patient_id == pat.id,
            CBHIPolicy.is_active.is_(True),
        )
        cbhi_policy = (await db.execute(cbhi_stmt)).scalar_one_or_none()
        patient_brief = PatientBillingBrief(
            id=pat.id,
            mrn=pat.mrn,
            first_name=pat.first_name,
            last_name=pat.last_name,
            gender=pat.gender.value if hasattr(pat.gender, "value") else str(pat.gender),
            phone_number=pat.phone_number,
            has_cbhi=cbhi_policy is not None,
            cbhi_household=cbhi_policy.household_number if cbhi_policy else None,
            cbhi_copay_rate=cbhi_policy.co_pay_percentage if cbhi_policy else 100.0,
        )

    # Fetch Items
    items_stmt = select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id)
    items = list((await db.execute(items_stmt)).scalars().all())

    # Fetch Payments
    payments_stmt = select(Payment).where(Payment.invoice_id == invoice.id).order_by(Payment.created_at.desc())
    payments = list((await db.execute(payments_stmt)).scalars().all())

    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        patient_id=invoice.patient_id,
        patient=patient_brief,
        total_amount=invoice.total_amount,
        insurance_covered_amount=invoice.insurance_covered_amount,
        patient_payable_amount=invoice.patient_payable_amount,
        paid_amount=invoice.paid_amount,
        status=invoice.status,
        notes=invoice.notes,
        created_at=invoice.created_at,
        items=[InvoiceItemResponse.model_validate(it) for it in items],
        payments=[PaymentResponse.model_validate(p) for p in payments],
    )


@router.get("/invoices", response_model=List[InvoiceResponse], summary="List Patient Invoices")
async def list_invoices(
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Optional[str] = Query(None, description="Filter by status: pending, paid, partial, cancelled, all"),
    search: Optional[str] = Query(None, description="Search by invoice number, patient name, or MRN"),
) -> List[InvoiceResponse]:
    """Retrieve all invoices with patient details, line items, and payment transactions."""
    query = select(Invoice).order_by(Invoice.created_at.desc())
    if status and status != "all":
        query = query.where(Invoice.status == status)

    res = await db.execute(query)
    invoices = list(res.scalars().all())

    results: List[InvoiceResponse] = []
    for inv in invoices:
        resp = await _enrich_invoice_response(db, inv)
        if search:
            s = search.lower()
            inv_match = s in resp.invoice_number.lower()
            pat_match = (
                resp.patient is not None
                and (
                    s in resp.patient.mrn.lower()
                    or s in resp.patient.first_name.lower()
                    or s in resp.patient.last_name.lower()
                )
            )
            if not (inv_match or pat_match):
                continue
        results.append(resp)

    return results


@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED, summary="Create Invoice")
async def create_invoice(
    invoice_in: InvoiceCreate,
    request: Request,
    current_user: Annotated[User, Depends(billing_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvoiceResponse:
    """Create a new itemized patient invoice with optional CBHI co-pay deduction."""
    # Check patient exists
    pat_stmt = select(Patient).where(Patient.id == invoice_in.patient_id)
    pat = (await db.execute(pat_stmt)).scalar_one_or_none()
    if not pat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient does not exist")

    subtotal = sum(item.unit_price * item.quantity for item in invoice_in.items)
    covered_amount = 0.0
    patient_payable = subtotal

    # Apply CBHI insurance policy if requested or available
    policy_stmt = select(CBHIPolicy).where(
        CBHIPolicy.patient_id == invoice_in.patient_id,
        CBHIPolicy.is_active.is_(True),
    )
    policy_res = await db.execute(policy_stmt)
    policy = policy_res.scalar_one_or_none()

    if invoice_in.apply_cbhi and policy:
        copay_rate = policy.co_pay_percentage / 100.0  # e.g., 10% co-pay
        patient_payable = round(subtotal * copay_rate, 2)
        covered_amount = round(subtotal - patient_payable, 2)

    invoice_number = f"INV-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

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

    return await _enrich_invoice_response(db, invoice)


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse, summary="Get Invoice Details")
async def get_invoice(
    invoice_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvoiceResponse:
    """Fetch invoice by ID with line items and payment transactions."""
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    res = await db.execute(stmt)
    invoice = res.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    return await _enrich_invoice_response(db, invoice)


@router.post("/cashier/pay", response_model=InvoiceResponse, summary="Cashier Direct Settlement (Cash, CBE Birr, CBHI)")
async def cashier_payment(
    payment_in: CashierPaymentRequest,
    request: Request,
    current_user: Annotated[User, Depends(billing_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvoiceResponse:
    """
    Hospital cashier processes direct payment via Cash, CBE Birr, CBHI Waiver, or Card.
    Updates invoice balance, marks PAID, and logs audit voucher.
    """
    stmt = select(Invoice).where(Invoice.id == payment_in.invoice_id)
    invoice = (await db.execute(stmt)).scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invoice is already fully settled")

    remaining_due = max(0.0, invoice.patient_payable_amount - invoice.paid_amount)
    pay_amount = payment_in.amount if payment_in.amount is not None else remaining_due

    if pay_amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment amount must be greater than zero")

    # Generate transaction reference
    prefix = {
        PaymentMethod.CASH: "CSH",
        PaymentMethod.CBE_BIRR: "CBE",
        PaymentMethod.CBHI: "CBHI-CLM",
        PaymentMethod.TELEBIRR: "TB",
        PaymentMethod.PRIVATE_INSURANCE: "INS",
    }.get(payment_in.payment_method, "TX")

    ref = payment_in.transaction_reference or f"{prefix}-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    payment = Payment(
        invoice_id=invoice.id,
        amount=pay_amount,
        payment_method=payment_in.payment_method,
        transaction_reference=ref,
        status=PaymentStatus.SUCCESS,
        payer_phone=payment_in.payer_phone,
        notes=payment_in.notes or f"Cashier settlement by {current_user.full_name}",
    )
    db.add(payment)

    invoice.paid_amount += pay_amount
    if invoice.paid_amount >= (invoice.patient_payable_amount - 0.01):
        invoice.status = InvoiceStatus.PAID
    else:
        invoice.status = InvoiceStatus.PARTIAL

    await db.commit()
    await db.refresh(invoice)

    await record_audit_event(
        db,
        user_id=current_user.id,
        action="PAYMENT_COLLECTED",
        resource="Invoice",
        resource_id=invoice.invoice_number,
        ip_address=get_client_ip(request),
        result="success",
        detail={"amount": pay_amount, "method": payment_in.payment_method.value, "reference": ref},
    )

    return await _enrich_invoice_response(db, invoice)


@router.post("/telebirr/pay", response_model=TelebirrPaymentResponse, summary="Initiate Telebirr Payment")
async def initiate_telebirr_payment(
    req_data: TelebirrPaymentRequest,
    current_user: Annotated[User, Depends(billing_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TelebirrPaymentResponse:
    """Trigger Telebirr push payment / QR checkout."""
    stmt = select(Invoice).where(Invoice.id == req_data.invoice_id)
    res = await db.execute(stmt)
    invoice = res.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invoice is already fully paid")

    checkout_url, ref, qr_data, amount_to_pay = await telebirr_service.initiate_payment(
        db,
        invoice=invoice,
        customer_phone=req_data.phone_number,
    )

    return TelebirrPaymentResponse(
        checkout_url=checkout_url,
        transaction_reference=ref,
        status="initiated",
        qr_data=qr_data,
        amount=amount_to_pay,
    )


@router.post("/telebirr/confirm", response_model=InvoiceResponse, summary="Confirm Telebirr Payment (Instant / USSD Approval)")
async def confirm_telebirr_payment(
    req: TelebirrConfirmRequest,
    current_user: Annotated[User, Depends(billing_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvoiceResponse:
    """
    Simulate/confirm customer USSD PIN approval on mobile phone.
    Transitions payment to SUCCESS and marks invoice PAID.
    """
    payment = await telebirr_service.process_payment_success(
        db,
        transaction_reference=req.transaction_reference,
    )
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction reference not found")

    stmt = select(Invoice).where(Invoice.id == payment.invoice_id)
    invoice = (await db.execute(stmt)).scalar_one()

    return await _enrich_invoice_response(db, invoice)


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


@router.get("/revenue/summary", response_model=RevenueSummaryResponse, summary="Daily Financial Revenue Summary")
async def get_revenue_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RevenueSummaryResponse:
    """Calculate real-time revenue KPIs and channel breakdown."""
    inv_res = await db.execute(select(Invoice))
    all_invoices = list(inv_res.scalars().all())

    pay_res = await db.execute(select(Payment).where(Payment.status == PaymentStatus.SUCCESS))
    all_payments = list(pay_res.scalars().all())

    today_total = sum(p.amount for p in all_payments)
    today_telebirr = sum(p.amount for p in all_payments if p.payment_method == PaymentMethod.TELEBIRR)
    today_cash = sum(p.amount for p in all_payments if p.payment_method == PaymentMethod.CASH)
    today_cbe = sum(p.amount for p in all_payments if p.payment_method == PaymentMethod.CBE_BIRR)
    today_cbhi = sum(inv.insurance_covered_amount for inv in all_invoices if inv.insurance_covered_amount > 0)

    pending_count = sum(1 for inv in all_invoices if inv.status == InvoiceStatus.PENDING)
    paid_count = sum(1 for inv in all_invoices if inv.status == InvoiceStatus.PAID)
    total_count = len(all_invoices)

    rate = (paid_count / total_count * 100.0) if total_count > 0 else 100.0

    return RevenueSummaryResponse(
        today_total_revenue=today_total,
        today_telebirr_revenue=today_telebirr,
        today_cash_revenue=today_cash,
        today_cbe_revenue=today_cbe,
        today_cbhi_claims=today_cbhi,
        pending_invoices_count=pending_count,
        paid_invoices_count=paid_count,
        total_invoices_count=total_count,
        collection_rate_percentage=round(rate, 1),
    )


@router.get("/cbhi/policies", response_model=List[CBHIPolicyResponse], summary="List Community-Based Health Insurance Policies")
async def list_cbhi_policies(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> List[CBHIPolicy]:
    """Retrieve all enrolled CBHI household coverage records."""
    stmt = select(CBHIPolicy).order_by(CBHIPolicy.id.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post("/cbhi/policies", response_model=CBHIPolicyResponse, status_code=status.HTTP_201_CREATED, summary="Enroll Patient in CBHI")
async def create_cbhi_policy(
    policy_in: CBHIPolicyCreate,
    current_user: Annotated[User, Depends(billing_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CBHIPolicy:
    """Register CBHI membership for a patient household."""
    policy = CBHIPolicy(**policy_in.model_dump(), is_active=True)
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return policy
