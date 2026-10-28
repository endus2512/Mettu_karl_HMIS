"""
Tests for Mass Casualty Incident (MCI) and START Protocol Disaster Triage.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.mci_service import calculate_start_triage


def test_start_triage_decision_logic():
    """Verify Simple Triage and Rapid Treatment (START) algorithm rules."""
    # 1. Apneic
    assert calculate_start_triage(is_ambulatory=False, is_breathing=False, respiratory_rate=0, has_radial_pulse=False, can_follow_commands=False) == "black_deceased"
    # 2. Walking wounded
    assert calculate_start_triage(is_ambulatory=True, is_breathing=True, respiratory_rate=20, has_radial_pulse=True, can_follow_commands=True) == "green_minor"
    # 3. Tachypneic (RR > 30) -> RED
    assert calculate_start_triage(is_ambulatory=False, is_breathing=True, respiratory_rate=36, has_radial_pulse=True, can_follow_commands=True) == "red_immediate"
    # 4. Absent radial pulse -> RED
    assert calculate_start_triage(is_ambulatory=False, is_breathing=True, respiratory_rate=22, has_radial_pulse=False, can_follow_commands=True) == "red_immediate"
    # 5. Unable to follow commands -> RED
    assert calculate_start_triage(is_ambulatory=False, is_breathing=True, respiratory_rate=22, has_radial_pulse=True, can_follow_commands=False) == "red_immediate"
    # 6. Stable non-ambulatory -> YELLOW
    assert calculate_start_triage(is_ambulatory=False, is_breathing=True, respiratory_rate=18, has_radial_pulse=True, can_follow_commands=True) == "yellow_delayed"


@pytest.mark.asyncio
async def test_mci_incident_lifecycle_and_tagging(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test declaring major disaster, tagging victims, and reviewing casualty statistics."""
    # 1. Declare Disaster
    mci_payload = {
        "incident_code": "MCI-MKH-2026-BUS",
        "incident_name": "Public Bus Rollover near Bedele Junction",
        "incident_location": "Bedele-Mettu Highway Km 18",
        "estimated_casualties": 35,
        "incident_commander": "Dr. Bekele Tadesse",
    }
    mci_res = await client.post("/api/v1/mci/incidents", json=mci_payload, headers=doctor_auth_headers)
    assert mci_res.status_code == 201
    incident_id = mci_res.json()["id"]

    # 2. Tag Red Casualty (Tachypnea RR 38)
    red_tag_payload = {
        "incident_id": incident_id,
        "triage_category": "red_immediate",
        "respiratory_rate": 38,
        "has_radial_pulse": True,
        "can_follow_commands": True,
        "assigned_bay": "Trauma Resus Bay 1",
        "disposition_notes": "Blunt chest trauma, suspected tension pneumothorax",
    }
    red_res = await client.post("/api/v1/mci/tags", json=red_tag_payload, headers=doctor_auth_headers)
    assert red_res.status_code == 201
    assert red_res.json()["tag_number"].startswith("MCI-RED-")

    # 3. Tag Yellow Casualty
    yel_tag_payload = {
        "incident_id": incident_id,
        "triage_category": "yellow_delayed",
        "respiratory_rate": 20,
        "has_radial_pulse": True,
        "can_follow_commands": True,
        "assigned_bay": "OPD Corridor Bay A",
        "disposition_notes": "Closed tibia-fibula fracture, splinted",
    }
    yel_res = await client.post("/api/v1/mci/tags", json=yel_tag_payload, headers=doctor_auth_headers)
    assert yel_res.status_code == 201
    assert yel_res.json()["tag_number"].startswith("MCI-YEL-")

    # 4. Review Incident Triage Statistics
    stats_res = await client.get(f"/api/v1/mci/incidents/{incident_id}/stats", headers=doctor_auth_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_tagged"] == 2
    assert stats["red_immediate"] == 1
    assert stats["yellow_delayed"] == 1

    # 5. Stand Down MCI
    sd_res = await client.post(f"/api/v1/mci/incidents/{incident_id}/stand-down", headers=doctor_auth_headers)
    assert sd_res.status_code == 200
    assert sd_res.json()["status"] == "stand_down"
