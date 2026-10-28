"""
Tests for Patient CRM, Feedback CSAT, and Grievance SLA Ticketing.
"""
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crm import GrievanceCategory, GrievancePriority, GrievanceStatus


@pytest.mark.asyncio
async def test_crm_csat_feedback_and_grievance_workflow(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test patient satisfaction survey submission and grievance redressal lifecycle."""
    # 1. Submit CSAT Rating
    csat_payload = {
        "department": "Emergency OPD",
        "rating_stars": 5,
        "comments": "Exceptional bedside manner from triage nurses.",
    }
    csat_res = await client.post("/api/v1/crm/feedback", json=csat_payload, headers=doctor_auth_headers)
    assert csat_res.status_code == 201
    assert csat_res.json()["rating_stars"] == 5

    # 2. Lodge Grievance Ticket with CRITICAL Priority (4h SLA)
    grv_payload = {
        "complainant_name": "Tolessa Bekele",
        "contact_phone": "+251911998877",
        "category": "clinical_care",
        "priority": "critical",
        "assigned_department": "Cardiology",
        "complaint_details": "Delayed physician consultation during acute chest pain.",
    }
    grv_res = await client.post("/api/v1/crm/grievances", json=grv_payload, headers=doctor_auth_headers)
    assert grv_res.status_code == 201
    ticket = grv_res.json()
    assert ticket["ticket_number"].startswith("GRV-")
    assert ticket["status"] == "submitted"
    ticket_id = ticket["id"]

    # 3. Resolve Grievance Ticket
    resolve_payload = {
        "resolution_summary": "Consultant cardiologist attended patient immediately and reviewed ECG protocol.",
    }
    res_ticket = await client.post(f"/api/v1/crm/grievances/{ticket_id}/resolve", json=resolve_payload, headers=doctor_auth_headers)
    assert res_ticket.status_code == 200
    resolved_data = res_ticket.json()
    assert resolved_data["status"] == "resolved"
    assert resolved_data["resolution_summary"] == resolve_payload["resolution_summary"]
    assert resolved_data["resolved_at"] is not None
