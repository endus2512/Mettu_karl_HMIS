"""
Billing and Insurance ORM models.
Supports domestic payment integrations (Telebirr, CBE Birr) and CBHI health insurance.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    TELEBIRR = "telebirr"
    CBE_BIRR = "cbe_birr"
    CBHI = "cbhi"
    PRIVATE_INSURANCE = "private_insurance"


class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    INITIATED = "initiated"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class CBHIPolicy(Base):
    """Community-Based Health Insurance (CBHI / Inshuraansii Fayyaa Hawaasaa) records."""
    __tablename__ = "cbhi_policies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    household_number: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    kebele: Mapped[str] = mapped_column(String(100), nullable=False)
    woreda: Mapped[str] = mapped_column(String(100), default="Mettu", nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    co_pay_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # e.g., 0% or 10%
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Invoice(Base):
    """Patient invoice entity."""
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), index=True)
    
    total_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    insurance_covered_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    patient_payable_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, name="invoice_status_enum", native_enum=False),
        default=InvoiceStatus.PENDING,
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    items: Mapped[list["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    """Itemized billing line for consultation, laboratory, pharmacy, or procedure."""
    __tablename__ = "invoice_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"), index=True)
    service_name: Mapped[str] = mapped_column(String(255), nullable=False)
    service_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")


class Payment(Base):
    """Payment transaction details including Telebirr reference and metadata."""
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id", ondelete="RESTRICT"), index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method_enum", native_enum=False),
        nullable=False,
    )
    transaction_reference: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status_enum", native_enum=False),
        default=PaymentStatus.SUCCESS,
        nullable=False,
    )
    payer_phone: Mapped[Optional[str]] = mapped_column(String(25), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")
