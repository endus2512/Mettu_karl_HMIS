"""
Tests for Queue Management and Smart Token System.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.queue import QueueDepartment, TicketPriority, TicketStatus


@pytest.mark.asyncio
async def test_queue_ticket_lifecycle(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Test issuing tokens and calling patients by priority."""
    dept = QueueDepartment(
        name="Outpatient Department 1",
        code="OPD_1",
        token_prefix="A",
        counter_name="Room 101",
        is_active=True,
    )
    db_session.add(dept)
    await db_session.commit()

    # 1. Issue normal ticket
    t1_res = await client.post("/api/v1/queue/tickets", json={"department_code": "OPD_1", "priority": "routine"})
    assert t1_res.status_code == 201
    t1_data = t1_res.json()
    assert t1_data["ticket_number"] == "A-001"

    # 2. Issue emergency ticket
    t2_res = await client.post("/api/v1/queue/tickets", json={"department_code": "OPD_1", "priority": "emergency"})
    assert t2_res.status_code == 201
    t2_data = t2_res.json()
    assert t2_data["ticket_number"] == "A-002"

    # 3. Call next: Emergency ticket A-002 should jump ahead of routine A-001
    call_res = await client.post(
        "/api/v1/queue/call-next",
        json={"department_code": "OPD_1", "room_counter": "Doctor Desk 1"},
        headers=doctor_auth_headers,
    )
    assert call_res.status_code == 200
    called_data = call_res.json()
    assert called_data["ticket_number"] == "A-002"
    assert called_data["status"] == "called"
