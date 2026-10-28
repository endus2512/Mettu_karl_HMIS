"""
Hospital Procurement, Public Tenders, Vendor Bidding, and Purchase Order ORM models.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TenderStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_EVALUATION = "in_evaluation"
    AWARDED = "awarded"
    CLOSED = "closed"


class BidStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    TECHNICAL_PASS = "technical_pass"
    DISQUALIFIED = "disqualified"
    AWARDED = "awarded"


class HospitalTender(Base):
    """Public or restricted hospital competitive procurement tender notice."""
    __tablename__ = "hospital_tenders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tender_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "TND-MKH-2026-08"
    title: Mapped[str] = mapped_column(String(255), nullable=False) # e.g. "Annual Supply of Operating Room Sutures & Linens"
    category: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Pharmaceuticals", "Biomedical Equipment"
    estimated_budget_etb: Mapped[float] = mapped_column(Float, nullable=False)

    submission_deadline: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    status: Mapped[TenderStatus] = mapped_column(
        Enum(TenderStatus, name="tender_status_enum", native_enum=False),
        default=TenderStatus.PUBLISHED,
        nullable=False,
    )
    specifications_summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    bids: Mapped[list["VendorBid"]] = relationship("VendorBid", back_populates="tender")


class VendorBid(Base):
    """Supplier quotation and proposal submitted for a hospital tender."""
    __tablename__ = "vendor_bids"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tender_id: Mapped[int] = mapped_column(ForeignKey("hospital_tenders.id", ondelete="CASCADE"), index=True)
    vendor_name: Mapped[str] = mapped_column(String(150), nullable=False)
    vendor_tin: Mapped[str] = mapped_column(String(50), nullable=False) # Tax Identification Number
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)

    quoted_amount_etb: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_timeline_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    technical_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # 0 to 100 points

    status: Mapped[BidStatus] = mapped_column(
        Enum(BidStatus, name="bid_status_enum", native_enum=False),
        default=BidStatus.SUBMITTED,
        nullable=False,
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    tender: Mapped["HospitalTender"] = relationship("HospitalTender", back_populates="bids")


class PurchaseOrder(Base):
    """Formal legally binding Purchase Order (PO) issued to winning supplier."""
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    po_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    tender_id: Mapped[Optional[int]] = mapped_column(ForeignKey("hospital_tenders.id", ondelete="SET NULL"), nullable=True)

    vendor_name: Mapped[str] = mapped_column(String(150), nullable=False)
    total_amount_etb: Mapped[float] = mapped_column(Float, nullable=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    issued_date: Mapped[date] = mapped_column(Date, nullable=False)
    delivery_deadline: Mapped[date] = mapped_column(Date, nullable=False)
