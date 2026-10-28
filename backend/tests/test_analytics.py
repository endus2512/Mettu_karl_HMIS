"""
Tests for Executive BI Analytics endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_executive_summary_dashboard(client: AsyncClient, doctor_auth_headers: dict[str, str]):
    """Test retrieving hospital executive summary metrics."""
    res = await client.get("/api/v1/analytics/executive-summary", headers=doctor_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_patients_registered" in data
    assert "bed_occupancy_rate_percent" in data
    assert "daily_gross_revenue_etb" in data
    assert "revenue_breakdown" in data
