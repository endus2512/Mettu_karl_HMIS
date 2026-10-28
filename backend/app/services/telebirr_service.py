"""
Telebirr domestic mobile payment gateway integration service.

Handles:
- Web checkout and in-person USSD/QR payment initiation
- Payload cryptographic signing and SHA256/RSA verification
- Webhook callback processing and invoice reconciliation
"""
import hashlib
import hmac
import json
import logging
import uuid
from typing import Any, Dict, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import Invoice, InvoiceStatus, Payment, PaymentMethod, PaymentStatus

logger = logging.getLogger(__name__)


class TelebirrService:
    """Telebirr API Integration Client."""

    def __init__(
        self,
        app_id: str = "METTU_KARL_HIS_TELEBIRR",
        app_key: str = "telebirr_mock_app_key_2026",
        short_code: str = "100234",
        notify_url: str = "https://his.mettukarl.hospital/api/v1/billing/telebirr/webhook",
    ):
        self.app_id = app_id
        self.app_key = app_key
        self.short_code = short_code
        self.notify_url = notify_url

    def sign_payload(self, params: Dict[str, Any]) -> str:
        """Create SHA256 HMAC signature for parameters."""
        sorted_keys = sorted(params.keys())
        query_string = "&".join(f"{k}={params[k]}" for k in sorted_keys if k != "sign" and params[k] is not None)
        signature = hmac.new(
            self.app_key.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return signature

    def verify_webhook_signature(self, payload: Dict[str, Any], received_signature: str) -> bool:
        """Verify Telebirr webhook callback authenticity."""
        expected_sig = self.sign_payload(payload)
        return hmac.compare_digest(expected_sig, received_signature)

    async def initiate_payment(
        self,
        db: AsyncSession,
        invoice: Invoice,
        customer_phone: str,
    ) -> Tuple[str, str]:
        """
        Create payment order for an invoice.
        
        Returns:
            (checkout_url, transaction_ref)
        """
        transaction_ref = f"TB-{uuid.uuid4().hex[:12].upper()}"
        amount_to_pay = invoice.patient_payable_amount - invoice.paid_amount

        # Record pending transaction in DB
        payment = Payment(
            invoice_id=invoice.id,
            amount=amount_to_pay,
            payment_method=PaymentMethod.TELEBIRR,
            transaction_reference=transaction_ref,
            status=PaymentStatus.INITIATED,
            payer_phone=customer_phone,
            notes=f"Telebirr payment for {invoice.invoice_number}",
        )
        db.add(payment)
        await db.commit()

        # Build simulated Telebirr checkout web/USSD URL
        checkout_url = (
            f"https://telebirr.ethiotelecom.et/payment/webCheckout?"
            f"appId={self.app_id}&tradeNo={transaction_ref}&totalAmount={amount_to_pay:.2f}"
        )
        return checkout_url, transaction_ref

    async def process_payment_success(
        self,
        db: AsyncSession,
        transaction_reference: str,
        paid_amount: float,
    ) -> Optional[Payment]:
        """Mark payment successful and update invoice status."""
        stmt = select(Payment).where(Payment.transaction_reference == transaction_reference)
        res = await db.execute(stmt)
        payment = res.scalar_one_or_none()

        if not payment:
            logger.warning(f"Telebirr payment with reference '{transaction_reference}' not found")
            return None

        payment.status = PaymentStatus.SUCCESS

        # Fetch associated invoice
        inv_stmt = select(Invoice).where(Invoice.id == payment.invoice_id)
        inv_res = await db.execute(inv_stmt)
        invoice = inv_res.scalar_one_or_none()

        if invoice:
            invoice.paid_amount += paid_amount
            if invoice.paid_amount >= invoice.patient_payable_amount:
                invoice.status = InvoiceStatus.PAID
            else:
                invoice.status = InvoiceStatus.PARTIAL

        await db.commit()
        await db.refresh(payment)
        return payment


telebirr_service = TelebirrService()
