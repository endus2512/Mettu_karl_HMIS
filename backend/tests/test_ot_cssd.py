"""
Tests for Operation Theatre (OT) Scheduling and CSSD Sterilization.
"""
from datetime import date, datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ot_cssd import CSSDBatch, OperatingRoom, SterilePack, SterilePackStatus, SterilizerType
from app.models.patient import Gender, Patient
from app.models.user import User


@pytest.mark.asyncio
async def test_ot_room_collision_avoidance(client: AsyncClient, doctor_auth_headers: dict[str, str], test_doctor_user: User, db_session: AsyncSession):
    """Verify that booking overlapping surgeries in the same operating room is rejected."""
    # 1. Create Room and Patient
    room = OperatingRoom(name="OT Suite 1 (Major General)", specialty="General Surgery", is_active=True)
    patient = Patient(mrn="MKH-SURG-01", fhir_id="fhir-surg-01", first_name="Baye", last_name="Tolera", birth_date=date(1990, 1, 1), gender=Gender.MALE)
    db_session.add_all([room, patient])
    await db_session.commit()

    start_time = datetime.now(timezone.utc) + timedelta(hours=2)
    end_time = start_time + timedelta(hours=2)

    booking_1 = {
        "patient_id": patient.id,
        "room_id": room.id,
        "procedure_name": "Open Cholecystectomy",
        "lead_surgeon_id": test_doctor_user.id,
        "scheduled_start": start_time.isoformat(),
        "scheduled_end": end_time.isoformat(),
    }

    # First booking succeeds
    res1 = await client.post("/api/v1/ot/bookings", json=booking_1, headers=doctor_auth_headers)
    assert res1.status_code == 201

    # Overlapping second booking should be rejected (409 Conflict)
    booking_conflict = {
        "patient_id": patient.id,
        "room_id": room.id,
        "procedure_name": "Emergency Hernia Repair",
        "lead_surgeon_id": test_doctor_user.id,
        "scheduled_start": (start_time + timedelta(minutes=30)).isoformat(), # Overlaps!
        "scheduled_end": (end_time + timedelta(hours=1)).isoformat(),
    }
    res2 = await client.post("/api/v1/ot/bookings", json=booking_conflict, headers=doctor_auth_headers)
    assert res2.status_code == 409


@pytest.mark.asyncio
async def test_cssd_active_sterile_packs(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Verify CSSD batch and sterile pack retrieval."""
    now = datetime.now(timezone.utc)
    batch = CSSDBatch(
        batch_code="CSSD-AUTOCLAVE-01",
        sterilizer_type=SterilizerType.STEAM_AUTOCLAVE,
        sterilizer_unit_name="Tuttnauer 5075",
        temperature_celsius=134.0,
        pressure_bar=2.2,
        cycle_duration_min=45,
        biological_indicator_passed=True,
    )
    db_session.add(batch)
    await db_session.commit()

    pack = SterilePack(
        pack_code="PACK-CS-001",
        batch_id=batch.id,
        pack_name="Caesarean Section Major Set",
        expiry_date=now + timedelta(days=28), # Valid for 28 more days
        status=SterilePackStatus.STERILE,
    )
    db_session.add(pack)
    await db_session.commit()

    res = await client.get("/api/v1/ot/cssd/packs", headers=doctor_auth_headers)
    assert res.status_code == 200
    packs = res.json()
    assert any(p["pack_code"] == "PACK-CS-001" and p["status"] == "sterile" for p in packs)
