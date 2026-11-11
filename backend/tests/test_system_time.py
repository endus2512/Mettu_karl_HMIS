"""
Tests for Online Hospital Time, Calendar Sync, and Shift Roster Management.
Verifies synchronized server time, Ethiopian Geez Calendar, shift progress, and persistence.
"""
import pytest
from httpx import AsyncClient

from app.models.hrm import ShiftType
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_get_online_time_sync(client: AsyncClient):
    """Test retrieving server time, Ethiopian calendar, and active shift."""
    res = await client.get("/api/v1/system/time-sync")
    assert res.status_code == 200
    data = res.json()

    assert "server_time" in data
    assert "timezone" in data
    assert data["ntp_synced"] is True

    # Gregorian
    greg = data["gregorian"]
    assert "date" in greg
    assert "year" in greg
    assert greg["year"] >= 2026

    # Ethiopian
    eth = data["ethiopian"]
    assert "month_name_om" in eth
    assert eth["year"] in [2018, 2019, 2020]
    assert "habasha_time_str" in eth

    # Shift
    shift = data["shift"]
    assert shift["type"] in ["morning", "afternoon", "night", "on_call"]
    assert shift["progress_percent"] >= 0.0
    assert shift["handover_countdown_minutes"] >= 0
    assert "charge_nurse" in shift
    assert "duty_physician" in shift


@pytest.mark.asyncio
async def test_get_shift_roster(client: AsyncClient, doctor_auth_headers: dict[str, str]):
    """Test retrieving ward shift roster (Staff only; unauth rejected)."""
    unauth = await client.get("/api/v1/system/shifts/roster")
    assert unauth.status_code == 401

    res = await client.get("/api/v1/system/shifts/roster", headers=doctor_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["on_duty_staff_count"] > 0
    assert len(data["roster"]) > 0
    assert data["roster"][0]["status"] == "On Duty"


@pytest.mark.asyncio
async def test_shift_override_and_reset(
    client: AsyncClient,
    test_doctor_user: User,
    doctor_auth_headers: dict[str, str],
):
    """Test shift override by clinician and resetting back to auto calculation."""
    override_payload = {
        "shift_type": "afternoon",
        "charge_nurse": "Nurse Chaltu Daba (BScN)",
        "duty_physician": "Dr. Bekele Tadesse (MD)",
        "handover_notes": "All ward vitals synchronized with central server.",
        "is_auto": False,
    }

    # Override shift
    res = await client.post(
        "/api/v1/system/shifts/override",
        json=override_payload,
        headers=doctor_auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["shift"]["type"] == "afternoon"
    assert data["shift"]["is_auto"] is False
    assert data["shift"]["handover_notes"] == "All ward vitals synchronized with central server."

    # Reset back to auto
    reset_res = await client.post(
        "/api/v1/system/shifts/reset-auto",
        headers=doctor_auth_headers,
    )
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["shift"]["is_auto"] is True
