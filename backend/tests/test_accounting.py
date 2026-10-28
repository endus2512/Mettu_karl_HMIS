"""
Tests for General Ledger, Double-Entry Balanced Assertions, and Trial Balance.
"""
from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.accounting import Account, AccountType


@pytest.mark.asyncio
async def test_double_entry_balanced_assertion(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Test that journal entries strictly enforce Sum(Debits) == Sum(Credits)."""
    # Create accounts: Cash (1010 Asset) and Consultation Revenue (4010 Revenue)
    acc_cash = Account(account_code="1010", account_name="Hospital Cash Desk", account_type=AccountType.ASSET, is_active=True)
    acc_rev = Account(account_code="4010", account_name="Outpatient Consultation Fees", account_type=AccountType.REVENUE, is_active=True)
    db_session.add_all([acc_cash, acc_rev])
    await db_session.commit()

    # 1. Unbalanced voucher should be rejected (400 Bad Request)
    unbalanced_entry = {
        "entry_date": str(date.today()),
        "description": "Patient Cash Payment Unbalanced",
        "items": [
            {"account_id": acc_cash.id, "debit": 500.0, "credit": 0.0},
            {"account_id": acc_rev.id, "debit": 0.0, "credit": 400.0}, # Diff of 100 ETB
        ],
    }
    res_bad = await client.post("/api/v1/accounting/journal-entries", json=unbalanced_entry, headers=doctor_auth_headers)
    assert res_bad.status_code == 400
    assert "Double-entry violation" in res_bad.json()["detail"]

    # 2. Balanced voucher should succeed (201 Created)
    balanced_entry = {
        "entry_date": str(date.today()),
        "description": "Patient Cash Payment Balanced",
        "items": [
            {"account_id": acc_cash.id, "debit": 500.0, "credit": 0.0},
            {"account_id": acc_rev.id, "debit": 0.0, "credit": 500.0},
        ],
    }
    res_good = await client.post("/api/v1/accounting/journal-entries", json=balanced_entry, headers=doctor_auth_headers)
    assert res_good.status_code == 201
    entry_data = res_good.json()
    assert entry_data["status"] == "posted"

    # 3. Verify Trial Balance compiles and is balanced
    res_tb = await client.get("/api/v1/accounting/reports/trial-balance", headers=doctor_auth_headers)
    assert res_tb.status_code == 200
    tb_data = res_tb.json()
    assert tb_data["is_balanced"] is True
    assert tb_data["total_debits"] == 500.0
    assert tb_data["total_credits"] == 500.0
