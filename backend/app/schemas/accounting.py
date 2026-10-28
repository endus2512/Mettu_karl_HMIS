"""
Pydantic schemas for General Ledger, Chart of Accounts, and Financial Statements.
"""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.accounting import AccountType, JournalEntryStatus


class AccountCreate(BaseModel):
    account_code: str
    account_name: str
    account_type: AccountType
    description: Optional[str] = None


class AccountResponse(AccountCreate):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


class JournalItemCreate(BaseModel):
    account_id: int
    debit: float = Field(default=0.0, ge=0.0)
    credit: float = Field(default=0.0, ge=0.0)
    line_description: Optional[str] = None


class JournalItemResponse(JournalItemCreate):
    id: int

    model_config = {"from_attributes": True}


class JournalEntryCreate(BaseModel):
    entry_date: date
    reference: Optional[str] = None
    description: str
    items: List[JournalItemCreate]


class JournalEntryResponse(BaseModel):
    id: int
    entry_number: str
    entry_date: date
    reference: Optional[str] = None
    description: str
    status: JournalEntryStatus
    created_at: datetime
    items: List[JournalItemResponse] = []

    model_config = {"from_attributes": True}


class TrialBalanceLine(BaseModel):
    account_code: str
    account_name: str
    account_type: AccountType
    total_debit: float
    total_credit: float
    net_balance: float


class TrialBalanceReport(BaseModel):
    as_of_date: date
    total_debits: float
    total_credits: float
    is_balanced: bool
    accounts: List[TrialBalanceLine]
