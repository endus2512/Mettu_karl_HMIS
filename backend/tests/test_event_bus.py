"""
Tests for Clinical Real-Time Event Bus, WebSockets, and Emergency Broadcasts (Code Blue).
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import ClinicalNotification


@pytest.mark.asyncio
async def test_event_bus_status(client: AsyncClient):
    """Verify event bus telemetry status endpoint."""
    res = await client.get("/api/v1/events/active-status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert "active_websockets" in data
    assert "connected_roles" in data


@pytest.mark.asyncio
async def test_dispatch_emergency_broadcast_code_blue(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test triggering a hospital-wide CODE BLUE resuscitation broadcast."""
    broadcast_payload = {
        "code_name": "CODE_BLUE",
        "location": "Emergency Bay 2",
        "details": "Trauma resuscitation required immediately. Anesthesia and crash cart dispatched.",
        "target_roles": ["all"],
        "department": "Emergency",
    }

    res = await client.post("/api/v1/events/notifications/broadcast", json=broadcast_payload, headers=doctor_auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert "Emergency Bay 2" in data["title"]
    assert data["severity"] == "emergency"
    assert data["category"] == "code_blue"
    assert data["is_read"] is False
    notification_id = data["id"]

    # Verify queryable from list notifications
    list_res = await client.get("/api/v1/events/notifications", headers=doctor_auth_headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(n["id"] == notification_id for n in list_data["items"])


@pytest.mark.asyncio
async def test_clinical_reaction_lifecycle(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test 1-click clinical reaction ('On My Way', 'At Bedside') on active alert."""
    # 1. Create a notification
    notif = ClinicalNotification(
        title="CODE BLUE: ICU Resuscitation",
        message="Patient in Bed 3 experiencing cardiac arrest",
        severity="emergency",
        category="code_blue",
        sender_name="Nurse Station 1",
        sender_role="nurse",
        target_role="all",
        is_read=False,
    )
    db_session.add(notif)
    await db_session.commit()
    await db_session.refresh(notif)

    # 2. Doctor reacts 'on_my_way'
    reaction_payload = {
        "reaction_type": "on_my_way",
        "reaction_note": "Running to ICU with defibrillator team",
    }
    react_res = await client.post(
        f"/api/v1/events/notifications/{notif.id}/react",
        json=reaction_payload,
        headers=doctor_auth_headers,
    )
    assert react_res.status_code == 200
    data = react_res.json()
    assert data["reaction_type"] == "on_my_way"
    assert data["reaction_note"] == "Running to ICU with defibrillator team"
    assert data["reaction_by"] is not None
    assert data["is_read"] is True


@pytest.mark.asyncio
async def test_mark_notification_read_and_clear_all(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test single mark-as-read and clear-all bulk operations."""
    notif1 = ClinicalNotification(
        title="Critical Lab Panic Value: Potassium 6.8 mmol/L",
        message="Patient MKH-90212 Ward 2 high potassium",
        severity="critical",
        category="lab_panic",
        sender_name="Central Laboratory",
        sender_role="technician",
        target_role="doctor",
        is_read=False,
    )
    notif2 = ClinicalNotification(
        title="Urgent Pharmacy Alert: IV Ceftriaxone Stock Low",
        message="Main dispensary inventory under 10 vials",
        severity="warning",
        category="urgent_rx",
        sender_name="Dispensary",
        sender_role="pharmacist",
        target_role="all",
        is_read=False,
    )
    db_session.add_all([notif1, notif2])
    await db_session.commit()

    # Mark notif1 as read
    read_res = await client.post(f"/api/v1/events/notifications/{notif1.id}/read", headers=doctor_auth_headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # Clear all remaining notifications
    clear_res = await client.post("/api/v1/events/notifications/clear-all", headers=doctor_auth_headers)
    assert clear_res.status_code == 200
    assert clear_res.json()["count"] >= 1
