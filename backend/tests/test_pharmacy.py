"""
Tests for Pharmacy, FEFO Dispensing, and Inventory Expiry Tracking.
"""
from datetime import date, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Gender, Patient
from app.models.pharmacy import DosageForm, Drug, DrugBatch
from app.services.pharmacy_service import get_fefo_batches_for_drug


@pytest.mark.asyncio
async def test_fefo_batch_ordering(db_session: AsyncSession):
    """Verify that batches are strictly selected in order of earliest expiry date."""
    drug = Drug(
        name="Amoxicillin 500mg",
        generic_name="Amoxicillin",
        dosage_form=DosageForm.CAPSULE,
        strength="500mg",
        unit_price=12.5,
        reorder_level=30,
    )
    db_session.add(drug)
    await db_session.commit()

    today = date.today()
    # Batch expiring in 6 months
    b_later = DrugBatch(
        drug_id=drug.id,
        batch_number="B-LATER",
        expiry_date=today + timedelta(days=180),
        initial_quantity=100,
        current_quantity=100,
    )
    # Batch expiring in 1 month (Should be selected first under FEFO)
    b_sooner = DrugBatch(
        drug_id=drug.id,
        batch_number="B-SOONER",
        expiry_date=today + timedelta(days=30),
        initial_quantity=50,
        current_quantity=50,
    )
    db_session.add_all([b_later, b_sooner])
    await db_session.commit()

    fefo_batches = await get_fefo_batches_for_drug(db_session, drug.id)
    assert len(fefo_batches) == 2
    assert fefo_batches[0].batch_number == "B-SOONER"
    assert fefo_batches[1].batch_number == "B-LATER"


@pytest.mark.asyncio
async def test_inventory_alerts(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Verify stock and expiry alerts endpoint."""
    drug = Drug(
        name="Paracetamol 500mg",
        generic_name="Acetaminophen",
        dosage_form=DosageForm.TABLET,
        strength="500mg",
        unit_price=2.0,
        reorder_level=100,
    )
    db_session.add(drug)
    await db_session.commit()

    # Batch with low stock (20 units < 100 threshold)
    batch = DrugBatch(
        drug_id=drug.id,
        batch_number="B-LOW",
        expiry_date=date.today() + timedelta(days=200),
        initial_quantity=20,
        current_quantity=20,
    )
    db_session.add(batch)
    await db_session.commit()

    res = await client.get("/api/v1/pharmacy/alerts", headers=doctor_auth_headers)
    assert res.status_code == 200
    alerts = res.json()
    assert any(a["drug_name"] == "Paracetamol 500mg" and a["alert_type"] == "LOW_STOCK" for a in alerts)
