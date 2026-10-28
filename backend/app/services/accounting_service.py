"""
General Ledger & Financial Accounting service.
Enforces double-entry bookkeeping rules (sum of Debits == sum of Credits) and compiles Trial Balance.
"""
from datetime import date
from typing import List, Optional
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.accounting import (
    Account,
    AccountType,
    JournalEntry,
    JournalEntryStatus,
    JournalItem,
)
from app.schemas.accounting import (
    JournalEntryCreate,
    TrialBalanceLine,
    TrialBalanceReport,
)


async def post_journal_entry(
    db: AsyncSession,
    entry_in: JournalEntryCreate,
    user_id: Optional[int] = None,
) -> JournalEntry:
    """
    Validate and post a double-entry general journal voucher.
    Strictly asserts that total debits equal total credits.
    """
    total_debits = sum(round(item.debit, 2) for item in entry_in.items)
    total_credits = sum(round(item.credit, 2) for item in entry_in.items)

    if round(total_debits, 2) != round(total_credits, 2):
        raise ValueError(
            f"Double-entry violation: Total Debits ({total_debits:.2f} ETB) does not balance with Total Credits ({total_credits:.2f} ETB)"
        )

    if total_debits <= 0:
        raise ValueError("Journal entry must have a non-zero debit and credit amount")

    entry_number = f"JV-{date.today().year}-{uuid.uuid4().hex[:6].upper()}"

    entry = JournalEntry(
        entry_number=entry_number,
        entry_date=entry_in.entry_date,
        reference=entry_in.reference,
        description=entry_in.description,
        status=JournalEntryStatus.POSTED,
        created_by_user_id=user_id,
    )
    db.add(entry)
    await db.flush()

    for item_in in entry_in.items:
        item = JournalItem(
            journal_entry_id=entry.id,
            account_id=item_in.account_id,
            debit=item_in.debit,
            credit=item_in.credit,
            line_description=item_in.line_description or entry_in.description,
        )
        db.add(item)

    await db.commit()
    await db.refresh(entry)
    return entry


async def generate_trial_balance(db: AsyncSession, as_of_date: date) -> TrialBalanceReport:
    """
    Generate the hospital Trial Balance statement as of a given date.
    Summarizes debits, credits, and net balances for all active accounts.
    """
    accounts_stmt = select(Account).where(Account.is_active.is_(True)).order_by(Account.account_code.asc())
    accounts_res = await db.execute(accounts_stmt)
    all_accounts = list(accounts_res.scalars().all())

    lines: List[TrialBalanceLine] = []
    grand_debit = 0.0
    grand_credit = 0.0

    for acc in all_accounts:
        stmt = (
            select(
                func.coalesce(func.sum(JournalItem.debit), 0.0),
                func.coalesce(func.sum(JournalItem.credit), 0.0),
            )
            .join(JournalEntry, JournalEntry.id == JournalItem.journal_entry_id)
            .where(
                JournalItem.account_id == acc.id,
                JournalEntry.entry_date <= as_of_date,
                JournalEntry.status == JournalEntryStatus.POSTED,
            )
        )
        res = await db.execute(stmt)
        tot_deb, tot_cred = res.one()
        tot_deb = float(tot_deb)
        tot_cred = float(tot_cred)

        grand_debit += tot_deb
        grand_credit += tot_cred

        # Normal balances: Assets & Expenses = Debit balance; Liabilities, Equity, Revenue = Credit balance
        if acc.account_type in (AccountType.ASSET, AccountType.EXPENSE):
            net = tot_deb - tot_cred
        else:
            net = tot_cred - tot_deb

        lines.append(
            TrialBalanceLine(
                account_code=acc.account_code,
                account_name=acc.account_name,
                account_type=acc.account_type,
                total_debit=tot_deb,
                total_credit=tot_cred,
                net_balance=net,
            )
        )

    return TrialBalanceReport(
        as_of_date=as_of_date,
        total_debits=round(grand_debit, 2),
        total_credits=round(grand_credit, 2),
        is_balanced=round(grand_debit, 2) == round(grand_credit, 2),
        accounts=lines,
    )
