"""
General Ledger, Double-Entry Journal Entries, and Financial Reporting endpoints.
"""
from datetime import date
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.accounting import Account, JournalEntry
from app.models.user import User, UserRole
from app.schemas.accounting import (
    AccountCreate,
    AccountResponse,
    JournalEntryCreate,
    JournalEntryResponse,
    TrialBalanceReport,
)
from app.services.accounting_service import generate_trial_balance, post_journal_entry

router = APIRouter()

# RBAC: Only Financial Officers, Billing Managers, and Admins can access General Ledger
financial_guard = require_roles(UserRole.ADMIN, UserRole.BILLING, UserRole.SUPER_ADMIN)


@router.get("/accounts", response_model=List[AccountResponse], summary="Chart of Accounts")
async def list_accounts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(financial_guard)],
) -> List[Account]:
    """Retrieve hospital general ledger chart of accounts."""
    stmt = select(Account).where(Account.is_active.is_(True)).order_by(Account.account_code.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post("/accounts", response_model=AccountResponse, status_code=status.HTTP_201_CREATED, summary="Create Ledger Account")
async def create_account(
    account_in: AccountCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(financial_guard)],
) -> Account:
    """Add a new account to the Chart of Accounts."""
    acc = Account(**account_in.model_dump())
    db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return acc


@router.post("/journal-entries", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED, summary="Post Journal Entry")
async def create_journal_entry(
    entry_in: JournalEntryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(financial_guard)],
) -> JournalEntry:
    """Post a balanced double-entry voucher (Total Debits == Total Credits)."""
    try:
        return await post_journal_entry(db, entry_in, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/reports/trial-balance", response_model=TrialBalanceReport, summary="Generate Trial Balance Report")
async def get_trial_balance_report(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(financial_guard)],
    as_of_date: Optional[date] = None,
) -> TrialBalanceReport:
    """Compile trial balance ensuring all debits and credits balance across the hospital ledger."""
    target_date = as_of_date or date.today()
    return await generate_trial_balance(db, as_of_date=target_date)
