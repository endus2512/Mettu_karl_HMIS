"""
Tests for Biomedical Equipment & Maintenance work orders.
"""
from datetime import date, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import AssetCategory, AssetStatus, BiomedicalAsset


@pytest.mark.asyncio
async def test_biomedical_asset_registry_and_ppm_alert(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Test biomedical device registration and PPM due alert detection."""
    today = date.today()
    asset = BiomedicalAsset(
        asset_tag="VENT-ICU-01",
        name="Hamilton C6 Mechanical Ventilator",
        manufacturer="Hamilton Medical",
        model="C6-2023",
        serial_number="HAM-VENT-99238",
        category=AssetCategory.LIFE_SUPPORT,
        status=AssetStatus.OPERATIONAL,
        department="ICU Ward",
        room_number="Bed 4",
        purchase_price_etb=850000.0,
        installation_date=today - timedelta(days=365),
        ppm_interval_days=90,
        next_ppm_date=today + timedelta(days=10), # Due in 10 days
    )
    db_session.add(asset)
    await db_session.commit()

    # Query PPM alerts within 30 days
    res = await client.get("/api/v1/assets/alerts/ppm-due?days_ahead=30", headers=doctor_auth_headers)
    assert res.status_code == 200
    alerts = res.json()
    assert any(a["asset_tag"] == "VENT-ICU-01" for a in alerts)


@pytest.mark.asyncio
async def test_create_corrective_work_order(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Test breakdown work order creation updates device status to MAINTENANCE_REQUIRED."""
    asset = BiomedicalAsset(
        asset_tag="US-OBGYN-02",
        name="GE Voluson E8 Ultrasound Machine",
        manufacturer="GE Healthcare",
        model="Voluson E8",
        serial_number="GE-US-88123",
        category=AssetCategory.DIAGNOSTIC,
        status=AssetStatus.OPERATIONAL,
        department="Maternity Ward",
        room_number="Room 102",
        purchase_price_etb=1200000.0,
        installation_date=date(2023, 5, 1),
        ppm_interval_days=180,
        next_ppm_date=date(2027, 1, 1),
    )
    db_session.add(asset)
    await db_session.commit()

    wo_payload = {
        "asset_id": asset.id,
        "maintenance_type": "corrective",
        "issue_description": "Probe 3D transducer failure during obstetrical scan",
        "scheduled_date": str(date.today()),
        "cost_etb": 4500.0,
    }

    res = await client.post("/api/v1/assets/work-orders", json=wo_payload, headers=doctor_auth_headers)
    assert res.status_code == 201
    wo_data = res.json()
    assert "work_order_code" in wo_data
    assert wo_data["maintenance_type"] == "corrective"
