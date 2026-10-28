"""
General Ledger & Financial Accounting ORM models.
Full double-entry bookkeeping with standard Chart of Accounts (COA) for hospital fiscal operations.
"""
from datetime import date, datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AccountType(str, enum.Enum):
    ASSET = "asset"          # 1000s - Cash, Bank, Accounts Receivable, Equipment
    LIABILITY = "liability"  # 2000s - Accounts Payable, Tax, Pension Payable
    EQUITY = "equity"        # 3000s - Retained Surplus, Hospital Fund Balance
    REVENUE = "revenue"      # 4000s - Patient Consultation, Labs, Pharmacy, CBHI Claims
    EXPENSE = "expense"      # 5000s - Salaries, Medical Supplies, Utilities, Maintenance


class JournalEntryStatus(str, enum.Enum):
    DRAFT = "draft"
    POSTED = "posted"
    VOID = "void"


class Account(Base):
    """Chart of Accounts (COA) general ledger ledger account."""
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    account_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False) # e.g. "1010", "4010"
    account_name: Mapped[str] = mapped_column(String(150), nullable=False) # e.g. "Commercial Bank of Ethiopia (CBE)"
    account_type: Mapped[AccountType] = mapped_column(
        Enum(AccountType, name="account_type_enum", native_enum=False),
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    journal_items: Mapped[list["JournalItem"]] = relationship("JournalItem", back_populates="account")


class JournalEntry(Base):
    """Double-entry general journal transaction header."""
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entry_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. "JV-2026-0010"
    entry_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "INV-9923" or "PAYROLL-10"
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[JournalEntryStatus] = mapped_column(
        Enum(JournalEntryStatus, name="journal_status_enum", native_enum=False),
        default=JournalEntryStatus.POSTED,
        nullable=False,
    )
    created_by_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    items: Mapped[list["JournalItem"]] = relationship("JournalItem", back_populates="entry", cascade="all, delete-orphan")


class JournalItem(Base):
    """Individual debit or credit posting line within a Journal Entry."""
    __tablename__ = "journal_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    journal_entry_id: Mapped[int] = mapped_column(ForeignKey("journal_entries.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id", ondelete="RESTRICT"), index=True)

    debit: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    credit: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    line_description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="items")
    account: Mapped["Account"] = relationship("Account", back_populates="journal_items")
