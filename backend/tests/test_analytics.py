"""
Tests for Executive BI Analytics endpoints & live CSV export.
"""
import csv
import io

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_executive_summary_dashboard(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    doctor_auth_headers: dict[str, str],
):
    """Test retrieving hospital executive summary metrics (Admin only; clinicians blocked)."""
    denied = await client.get("/api/v1/analytics/executive-summary", headers=doctor_auth_headers)
    assert denied.status_code == 403

    for time_range in ("today", "week", "month", "quarter"):
        res = await client.get(
            f"/api/v1/analytics/executive-summary?time_range={time_range}",
            headers=admin_auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["time_range"] == time_range
        assert "generated_at" in data and data["generated_at"]
        assert "total_patients_registered" in data
        assert "new_patients_in_period" in data
        assert "patient_growth_percent" in data
        assert "total_beds" in data
        assert "occupied_beds" in data
        assert "available_beds" in data
        assert "bed_occupancy_rate_percent" in data
        assert "daily_gross_revenue_etb" in data
        assert "revenue_breakdown" in data
        assert "ward_occupancy_breakdown" in data
        assert "ot_surgeries_total" in data
        assert "ot_surgeries_completed" in data
        assert "lab_orders_total" in data
        assert "lab_orders_completed" in data
        assert "average_length_of_stay_days" in data
        assert "bed_turnover_rate" in data
        assert "surgical_site_infection_rate_percent" in data
        assert "moh_safety_index_score" in data


@pytest.mark.asyncio
async def test_executive_summary_csv_export(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    doctor_auth_headers: dict[str, str],
):
    """Test downloading real MoH KPI summary CSV (Admin only; clinicians blocked)."""
    denied = await client.get(
        "/api/v1/analytics/executive-summary/export?time_range=month",
        headers=doctor_auth_headers,
    )
    assert denied.status_code == 403

    res = await client.get(
        "/api/v1/analytics/executive-summary/export?time_range=week",
        headers=admin_auth_headers,
    )
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment;" in res.headers["content-disposition"]
    assert "mettu-karl-moh-kpi-week-" in res.headers["content-disposition"]

    rows = list(csv.reader(io.StringIO(res.text)))
    assert len(rows) > 15
    assert "Mettu Karl Comprehensive Specialized Hospital" in rows[0][0]
    assert rows[1] == ["Time Range", "WEEK"]
    flat_text = res.text
    assert "Total Registered Patients" in flat_text
    assert "Bed Occupancy Rate (BOR)" in flat_text
    assert "Gross Revenue Collected" in flat_text
    assert "MoH Safety Index Score" in flat_text
