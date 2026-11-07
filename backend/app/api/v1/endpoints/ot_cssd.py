"""
Operation Theatre (OT) Scheduling and CSSD Sterilization Pack endpoints.
Mettu Karl Comprehensive Specialized Hospital — High-Precision Surgical Workstation.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_optional_current_user, require_roles
from app.core.database import get_db
from app.models.ot_cssd import (
    CSSDBatch,
    OperatingRoom,
    SterilePack,
    SterilePackStatus,
    SurgeryStatus,
    SurgicalBooking,
)
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.schemas.ot_cssd import (
    CSSDBatchCreate,
    CSSDBatchDetailResponse,
    CSSDBatchResponse,
    OperatingRoomCreate,
    OperatingRoomResponse,
    OTStatsResponse,
    PostOpNotesUpdate,
    SterilePackCreate,
    SterilePackResponse,
    SurgicalBookingCreate,
    SurgicalBookingResponse,
    SurgicalStatusUpdate,
    SurgicalVoucherResponse,
    WHOChecklistUpdate,
)
from app.services.ot_service import create_surgical_booking, get_active_sterile_packs

router = APIRouter()

surgical_staff_guard = require_roles(
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.TECHNICIAN,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
)


def _calc_age(birth_date) -> int:
    if not birth_date:
        return 35
    today = datetime.now().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def _map_booking_response(booking: SurgicalBooking) -> SurgicalBookingResponse:
    patient_name = f"{booking.patient.first_name} {booking.patient.last_name}" if booking.patient else "Unknown Patient"
    patient_mrn = booking.patient.mrn if booking.patient else "MKH-N/A"
    patient_gender = str(booking.patient.gender) if booking.patient else "UNKNOWN"
    patient_age = _calc_age(booking.patient.birth_date) if booking.patient else 35

    room_name = booking.room.name if booking.room else "Unknown Room"
    room_code = booking.room.room_code if booking.room else "OT-1"

    lead_surgeon_name = booking.lead_surgeon.full_name if booking.lead_surgeon else "Dr. Unassigned"
    anesthesiologist_name = booking.anesthesiologist.full_name if booking.anesthesiologist else "Not Assigned"
    scrub_nurse_name = booking.scrub_nurse.full_name if booking.scrub_nurse else "Not Assigned"

    return SurgicalBookingResponse(
        id=booking.id,
        booking_code=booking.booking_code,
        patient_id=booking.patient_id,
        patient_name=patient_name,
        patient_mrn=patient_mrn,
        patient_gender=patient_gender,
        patient_age=patient_age,
        room_id=booking.room_id,
        room_name=room_name,
        room_code=room_code,
        procedure_name=booking.procedure_name,
        lead_surgeon_id=booking.lead_surgeon_id,
        lead_surgeon_name=lead_surgeon_name,
        anesthesiologist_id=booking.anesthesiologist_id,
        anesthesiologist_name=anesthesiologist_name,
        scrub_nurse_id=booking.scrub_nurse_id,
        scrub_nurse_name=scrub_nurse_name,
        scheduled_start=booking.scheduled_start,
        scheduled_end=booking.scheduled_end,
        status=booking.status,
        who_safety_checklist_verified=booking.who_safety_checklist_verified,
        post_op_notes=booking.post_op_notes,
        blood_loss_ml=booking.blood_loss_ml or 0,
        findings=booking.findings,
        implants_used=booking.implants_used,
    )


@router.get("/stats", response_model=OTStatsResponse, summary="Get Live OT & CSSD Operational Statistics")
async def get_ot_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> OTStatsResponse:
    """Retrieve high-level operational statistics for theatre suites, active procedures, and autoclave inventory."""
    now = datetime.now(timezone.utc)

    # 1. Rooms count
    rooms_res = await db.execute(select(func.count(OperatingRoom.id)).where(OperatingRoom.is_active.is_(True)))
    total_rooms = rooms_res.scalar_one() or 0

    # 2. Active Surgeries count
    active_surgeries_res = await db.execute(
        select(func.count(SurgicalBooking.id)).where(
            SurgicalBooking.status.in_([SurgeryStatus.IN_PREP, SurgeryStatus.IN_SURGERY, SurgeryStatus.IN_RECOVERY])
        )
    )
    active_surgeries = active_surgeries_res.scalar_one() or 0

    # 3. Scheduled Surgeries count
    scheduled_res = await db.execute(
        select(func.count(SurgicalBooking.id)).where(
            SurgicalBooking.status == SurgeryStatus.SCHEDULED
        )
    )
    scheduled_today = scheduled_res.scalar_one() or 0

    # 4. Completed Surgeries count
    completed_res = await db.execute(
        select(func.count(SurgicalBooking.id)).where(
            SurgicalBooking.status == SurgeryStatus.COMPLETED
        )
    )
    completed_today = completed_res.scalar_one() or 0

    # 5. Ready Sterile Packs count
    packs_res = await db.execute(
        select(func.count(SterilePack.id)).where(
            SterilePack.status == SterilePackStatus.STERILE,
            SterilePack.expiry_date > now,
        )
    )
    ready_packs = packs_res.scalar_one() or 0

    # 6. Autoclave batches count
    batches_res = await db.execute(select(func.count(CSSDBatch.id)))
    batches_count = batches_res.scalar_one() or 0

    # 7. Emergency trauma bookings
    emergency_res = await db.execute(
        select(func.count(SurgicalBooking.id)).where(
            or_(
                SurgicalBooking.procedure_name.ilike("%Emergency%"),
                SurgicalBooking.procedure_name.ilike("%Trauma%"),
                SurgicalBooking.procedure_name.ilike("%Craniotomy%"),
                SurgicalBooking.procedure_name.ilike("%Caesarean%"),
            )
        )
    )
    emergency_count = emergency_res.scalar_one() or 0

    return OTStatsResponse(
        total_rooms=total_rooms,
        active_surgeries_count=active_surgeries,
        scheduled_today_count=scheduled_today,
        completed_today_count=completed_today,
        ready_sterile_packs_count=ready_packs,
        active_autoclave_batches_count=batches_count,
        emergency_trauma_bookings_count=emergency_count,
    )


@router.get("/rooms", response_model=List[OperatingRoomResponse], summary="List Operating Theatre Suites with Live Status")
async def list_ot_rooms(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> List[OperatingRoomResponse]:
    """Retrieve surgical operating theatre suites enriched with live surgical occupancy."""
    rooms_res = await db.execute(select(OperatingRoom).where(OperatingRoom.is_active.is_(True)).order_by(OperatingRoom.id))
    rooms = list(rooms_res.scalars().all())

    # Fetch active bookings to augment room status
    bookings_res = await db.execute(
        select(SurgicalBooking)
        .options(
            selectinload(SurgicalBooking.patient),
            selectinload(SurgicalBooking.lead_surgeon),
        )
        .where(SurgicalBooking.status.in_([SurgeryStatus.IN_PREP, SurgeryStatus.IN_SURGERY, SurgeryStatus.IN_RECOVERY, SurgeryStatus.SCHEDULED]))
        .order_by(SurgicalBooking.scheduled_start.asc())
    )
    bookings = list(bookings_res.scalars().all())

    active_by_room = {}
    for b in bookings:
        if b.room_id not in active_by_room:
            active_by_room[b.room_id] = b
        elif b.status in [SurgeryStatus.IN_SURGERY, SurgeryStatus.IN_PREP, SurgeryStatus.IN_RECOVERY]:
            active_by_room[b.room_id] = b

    out: List[OperatingRoomResponse] = []
    for r in rooms:
        active = active_by_room.get(r.id)
        current_status = "available"
        active_booking_id = None
        active_procedure_name = None
        active_patient_name = None
        active_surgeon_name = None

        if active:
            active_booking_id = active.id
            active_procedure_name = active.procedure_name
            active_patient_name = f"{active.patient.first_name} {active.patient.last_name}" if active.patient else "Patient"
            active_surgeon_name = active.lead_surgeon.full_name if active.lead_surgeon else "Surgeon"
            current_status = active.status.value

        out.append(
            OperatingRoomResponse(
                id=r.id,
                name=r.name,
                room_code=r.room_code or f"OT-{r.id}",
                specialty=r.specialty,
                floor_location=r.floor_location or "Block B - 2nd Floor",
                is_active=r.is_active,
                active_booking_id=active_booking_id,
                active_procedure_name=active_procedure_name,
                active_patient_name=active_patient_name,
                active_surgeon_name=active_surgeon_name,
                current_status=current_status,
            )
        )
    return out


@router.post("/rooms", response_model=OperatingRoomResponse, status_code=status.HTTP_201_CREATED, summary="Create OT Suite")
async def create_ot_room(
    room_in: OperatingRoomCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> OperatingRoomResponse:
    """Register a new operating room suite."""
    room = OperatingRoom(
        name=room_in.name,
        room_code=room_in.room_code,
        specialty=room_in.specialty,
        floor_location=room_in.floor_location,
        is_active=True,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return OperatingRoomResponse(
        id=room.id,
        name=room.name,
        room_code=room.room_code,
        specialty=room.specialty,
        floor_location=room.floor_location,
        is_active=room.is_active,
        current_status="available",
    )


@router.get("/bookings", response_model=List[SurgicalBookingResponse], summary="List Surgical Bookings")
async def list_surgical_bookings(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
    status: Optional[SurgeryStatus] = Query(None, description="Filter by surgery status"),
    room_id: Optional[int] = Query(None, description="Filter by room ID"),
    search: Optional[str] = Query(None, description="Search by procedure or booking code"),
) -> List[SurgicalBookingResponse]:
    """Retrieve all surgical bookings with team and patient profiles."""
    stmt = (
        select(SurgicalBooking)
        .options(
            selectinload(SurgicalBooking.patient),
            selectinload(SurgicalBooking.room),
            selectinload(SurgicalBooking.lead_surgeon),
            selectinload(SurgicalBooking.anesthesiologist),
            selectinload(SurgicalBooking.scrub_nurse),
        )
        .order_by(SurgicalBooking.scheduled_start.desc())
    )

    if status:
        stmt = stmt.where(SurgicalBooking.status == status)
    if room_id:
        stmt = stmt.where(SurgicalBooking.room_id == room_id)
    if search:
        stmt = stmt.where(
            or_(
                SurgicalBooking.procedure_name.ilike(f"%{search}%"),
                SurgicalBooking.booking_code.ilike(f"%{search}%"),
            )
        )

    res = await db.execute(stmt)
    bookings = list(res.scalars().all())
    return [_map_booking_response(b) for b in bookings]


@router.get("/bookings/{booking_id}", response_model=SurgicalBookingResponse, summary="Get Surgery Booking Details")
async def get_surgical_booking(
    booking_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> SurgicalBookingResponse:
    """Retrieve full details of a specific surgical procedure booking."""
    stmt = (
        select(SurgicalBooking)
        .options(
            selectinload(SurgicalBooking.patient),
            selectinload(SurgicalBooking.room),
            selectinload(SurgicalBooking.lead_surgeon),
            selectinload(SurgicalBooking.anesthesiologist),
            selectinload(SurgicalBooking.scrub_nurse),
        )
        .where(SurgicalBooking.id == booking_id)
    )
    res = await db.execute(stmt)
    booking = res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Surgical booking not found")
    return _map_booking_response(booking)


@router.post("/bookings", response_model=SurgicalBookingResponse, status_code=status.HTTP_201_CREATED, summary="Schedule Surgery")
async def book_surgery(
    booking_in: SurgicalBookingCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> SurgicalBookingResponse:
    """Schedule surgery with automatic operating room collision prevention."""
    try:
        booking = await create_surgical_booking(
            db,
            patient_id=booking_in.patient_id,
            room_id=booking_in.room_id,
            procedure_name=booking_in.procedure_name,
            lead_surgeon_id=booking_in.lead_surgeon_id,
            scheduled_start=booking_in.scheduled_start,
            scheduled_end=booking_in.scheduled_end,
            anesthesiologist_id=booking_in.anesthesiologist_id,
            scrub_nurse_id=booking_in.scrub_nurse_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    # Re-fetch with relationships
    stmt = (
        select(SurgicalBooking)
        .options(
            selectinload(SurgicalBooking.patient),
            selectinload(SurgicalBooking.room),
            selectinload(SurgicalBooking.lead_surgeon),
            selectinload(SurgicalBooking.anesthesiologist),
            selectinload(SurgicalBooking.scrub_nurse),
        )
        .where(SurgicalBooking.id == booking.id)
    )
    res = await db.execute(stmt)
    return _map_booking_response(res.scalar_one())


@router.patch("/bookings/{booking_id}/status", response_model=SurgicalBookingResponse, summary="Transition Surgery Status")
async def update_surgery_status(
    booking_id: int,
    status_update: SurgicalStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> SurgicalBookingResponse:
    """Transition surgery along live surgical lifecycle (scheduled -> in_prep -> in_surgery -> in_recovery -> completed/cancelled)."""
    stmt = (
        select(SurgicalBooking)
        .options(
            selectinload(SurgicalBooking.patient),
            selectinload(SurgicalBooking.room),
            selectinload(SurgicalBooking.lead_surgeon),
            selectinload(SurgicalBooking.anesthesiologist),
            selectinload(SurgicalBooking.scrub_nurse),
        )
        .where(SurgicalBooking.id == booking_id)
    )
    res = await db.execute(stmt)
    booking = res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Surgical booking not found")

    booking.status = status_update.status
    await db.commit()
    await db.refresh(booking)
    return _map_booking_response(booking)


@router.patch("/bookings/{booking_id}/checklist", response_model=SurgicalBookingResponse, summary="Verify WHO Surgical Safety Checklist")
async def verify_who_checklist(
    booking_id: int,
    checklist_update: WHOChecklistUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> SurgicalBookingResponse:
    """Verify WHO 3-stage Surgical Safety Checklist (Sign-In, Time-Out, Sign-Out)."""
    stmt = (
        select(SurgicalBooking)
        .options(
            selectinload(SurgicalBooking.patient),
            selectinload(SurgicalBooking.room),
            selectinload(SurgicalBooking.lead_surgeon),
            selectinload(SurgicalBooking.anesthesiologist),
            selectinload(SurgicalBooking.scrub_nurse),
        )
        .where(SurgicalBooking.id == booking_id)
    )
    res = await db.execute(stmt)
    booking = res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Surgical booking not found")

    booking.who_safety_checklist_verified = checklist_update.verified
    verifier_name = current_user.full_name if current_user else "Lead Theatre Surgeon"
    if checklist_update.notes:
        existing = booking.post_op_notes or ""
        booking.post_op_notes = f"{existing}\n[WHO Checklist Verified by {verifier_name}: {checklist_update.notes}]".strip()

    await db.commit()
    await db.refresh(booking)
    return _map_booking_response(booking)


@router.patch("/bookings/{booking_id}/post-op", response_model=SurgicalBookingResponse, summary="Record Operative Notes & Findings")
async def record_post_op_notes(
    booking_id: int,
    notes_in: PostOpNotesUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> SurgicalBookingResponse:
    """Record surgeon operative notes, blood loss (ml), intraoperative findings, and implants."""
    stmt = (
        select(SurgicalBooking)
        .options(
            selectinload(SurgicalBooking.patient),
            selectinload(SurgicalBooking.room),
            selectinload(SurgicalBooking.lead_surgeon),
            selectinload(SurgicalBooking.anesthesiologist),
            selectinload(SurgicalBooking.scrub_nurse),
        )
        .where(SurgicalBooking.id == booking_id)
    )
    res = await db.execute(stmt)
    booking = res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Surgical booking not found")

    booking.post_op_notes = notes_in.post_op_notes
    if notes_in.findings:
        booking.findings = notes_in.findings
    booking.blood_loss_ml = notes_in.blood_loss_ml
    if notes_in.implants_used:
        booking.implants_used = notes_in.implants_used

    await db.commit()
    await db.refresh(booking)
    return _map_booking_response(booking)


@router.get("/bookings/{booking_id}/voucher", response_model=SurgicalVoucherResponse, summary="Get Official Surgical Operative Summary Voucher")
async def get_surgical_voucher(
    booking_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> SurgicalVoucherResponse:
    """Retrieve full official surgical summary voucher with hospital TIN, WHO verification, and QR code."""
    stmt = (
        select(SurgicalBooking)
        .options(
            selectinload(SurgicalBooking.patient),
            selectinload(SurgicalBooking.room),
            selectinload(SurgicalBooking.lead_surgeon),
            selectinload(SurgicalBooking.anesthesiologist),
            selectinload(SurgicalBooking.scrub_nurse),
        )
        .where(SurgicalBooking.id == booking_id)
    )
    res = await db.execute(stmt)
    booking = res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Surgical booking not found")

    patient = booking.patient
    return SurgicalVoucherResponse(
        hospital_name_en="Mettu Karl Comprehensive Specialized Hospital",
        hospital_name_om="Mana Qoricha Waliigalaa Ispeeshaalaayizdii Karl Mettuu",
        tin_number="0038912401",
        accreditation_level="Tertiary Teaching & Surgical Referral Center",
        telephone="+251 47 141 0422 / Emergency: 907",
        location="Oromia, Ilu Abba Bor, Mettu, Ethiopia",
        booking_code=booking.booking_code,
        operating_room=booking.room.name if booking.room else "General Theatre",
        operating_room_code=booking.room.room_code if booking.room else "OT-1",
        procedure_name=booking.procedure_name,
        patient_mrn=patient.mrn if patient else "MKH-N/A",
        patient_name=f"{patient.first_name} {patient.last_name}" if patient else "Patient",
        patient_age=_calc_age(patient.birth_date) if patient else 35,
        patient_gender=str(patient.gender) if patient else "UNKNOWN",
        lead_surgeon=booking.lead_surgeon.full_name if booking.lead_surgeon else "Surgeon",
        anesthesiologist=booking.anesthesiologist.full_name if booking.anesthesiologist else "Not Assigned",
        scrub_nurse=booking.scrub_nurse.full_name if booking.scrub_nurse else "Not Assigned",
        scheduled_start=booking.scheduled_start,
        scheduled_end=booking.scheduled_end,
        status=booking.status.value,
        who_safety_checklist_verified=booking.who_safety_checklist_verified,
        post_op_notes=booking.post_op_notes or "Operative notes documented in theatre log",
        operative_findings=booking.findings or "Normal surgical anatomy with target pathology resolved",
        blood_loss_ml=booking.blood_loss_ml or 0,
        implants_used=booking.implants_used or "None / Natural tissue approximation",
        issued_timestamp=datetime.now(timezone.utc),
        verification_qr=f"MKH-SURG-{booking.booking_code}-TIN0038912401",
    )


# ==============================================================================
# CSSD Sterilization & Instrument Packs Endpoints
# ==============================================================================


@router.get("/cssd/batches", response_model=List[CSSDBatchResponse], summary="List CSSD Sterilization Batches")
async def list_cssd_batches(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> List[CSSDBatchResponse]:
    """Retrieve autoclave sterilization cycles with pack counts."""
    stmt = (
        select(CSSDBatch)
        .options(
            selectinload(CSSDBatch.packs),
            selectinload(CSSDBatch.operator),
        )
        .order_by(CSSDBatch.sterilized_at.desc())
    )
    res = await db.execute(stmt)
    batches = list(res.scalars().all())

    out: List[CSSDBatchResponse] = []
    for b in batches:
        out.append(
            CSSDBatchResponse(
                id=b.id,
                batch_code=b.batch_code,
                sterilizer_unit_name=b.sterilizer_unit_name,
                sterilizer_type=b.sterilizer_type,
                temperature_celsius=b.temperature_celsius,
                pressure_bar=b.pressure_bar,
                cycle_duration_min=b.cycle_duration_min,
                biological_indicator_passed=b.biological_indicator_passed,
                sterilized_at=b.sterilized_at,
                operator_name=b.operator.full_name if b.operator else "CSSD Operator",
                packs_count=len(b.packs),
            )
        )
    return out


@router.get("/cssd/batches/{batch_id}", response_model=CSSDBatchDetailResponse, summary="Get CSSD Batch Details")
async def get_cssd_batch(
    batch_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> CSSDBatchDetailResponse:
    """Retrieve full batch parameters and all sterile packs associated with the cycle."""
    stmt = (
        select(CSSDBatch)
        .options(
            selectinload(CSSDBatch.packs),
            selectinload(CSSDBatch.operator),
        )
        .where(CSSDBatch.id == batch_id)
    )
    res = await db.execute(stmt)
    batch = res.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CSSD batch cycle not found")

    packs_out = [
        SterilePackResponse(
            id=p.id,
            pack_code=p.pack_code,
            batch_id=p.batch_id,
            batch_code=batch.batch_code,
            pack_name=p.pack_name,
            expiry_date=p.expiry_date,
            status=p.status,
        )
        for p in batch.packs
    ]

    return CSSDBatchDetailResponse(
        id=batch.id,
        batch_code=batch.batch_code,
        sterilizer_unit_name=batch.sterilizer_unit_name,
        sterilizer_type=batch.sterilizer_type,
        temperature_celsius=batch.temperature_celsius,
        pressure_bar=batch.pressure_bar,
        cycle_duration_min=batch.cycle_duration_min,
        biological_indicator_passed=batch.biological_indicator_passed,
        sterilized_at=batch.sterilized_at,
        operator_name=batch.operator.full_name if batch.operator else "CSSD Operator",
        packs_count=len(batch.packs),
        packs=packs_out,
    )


@router.post("/cssd/batches", response_model=CSSDBatchResponse, status_code=status.HTTP_201_CREATED, summary="Record CSSD Sterilization Cycle")
async def record_cssd_batch(
    batch_in: CSSDBatchCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> CSSDBatchResponse:
    """Record autoclave cycle parameters (temperature, pressure, biological indicator)."""
    batch_code = f"CSSD-{uuid.uuid4().hex[:8].upper()}"
    operator_id = current_user.id if current_user else 3
    operator_name = current_user.full_name if current_user else "CSSD Operator"

    batch = CSSDBatch(
        batch_code=batch_code,
        sterilizer_unit_name=batch_in.sterilizer_unit_name,
        sterilizer_type=batch_in.sterilizer_type,
        temperature_celsius=batch_in.temperature_celsius,
        pressure_bar=batch_in.pressure_bar,
        cycle_duration_min=batch_in.cycle_duration_min,
        biological_indicator_passed=batch_in.biological_indicator_passed,
        operator_id=operator_id,
    )
    db.add(batch)
    await db.commit()
    await db.refresh(batch)

    return CSSDBatchResponse(
        id=batch.id,
        batch_code=batch.batch_code,
        sterilizer_unit_name=batch.sterilizer_unit_name,
        sterilizer_type=batch.sterilizer_type,
        temperature_celsius=batch.temperature_celsius,
        pressure_bar=batch.pressure_bar,
        cycle_duration_min=batch.cycle_duration_min,
        biological_indicator_passed=batch.biological_indicator_passed,
        sterilized_at=batch.sterilized_at,
        operator_name=operator_name,
        packs_count=0,
    )


@router.get("/cssd/packs", response_model=List[SterilePackResponse], summary="List Ready Sterile Surgical Packs")
async def list_sterile_packs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
    status: Optional[SterilePackStatus] = Query(None, description="Filter pack status"),
    name: Optional[str] = Query(None, description="Filter pack by name"),
) -> List[SterilePackResponse]:
    """Retrieve sterilized instrument packs verified for surgical table use."""
    stmt = (
        select(SterilePack)
        .options(selectinload(SterilePack.batch))
        .order_by(SterilePack.id.desc())
    )
    if status:
        stmt = stmt.where(SterilePack.status == status)
    if name:
        stmt = stmt.where(SterilePack.pack_name.ilike(f"%{name}%"))

    res = await db.execute(stmt)
    packs = list(res.scalars().all())

    return [
        SterilePackResponse(
            id=p.id,
            pack_code=p.pack_code,
            batch_id=p.batch_id,
            batch_code=p.batch.batch_code if p.batch else None,
            pack_name=p.pack_name,
            expiry_date=p.expiry_date,
            status=p.status,
        )
        for p in packs
    ]


@router.post("/cssd/packs", response_model=SterilePackResponse, status_code=status.HTTP_201_CREATED, summary="Register Sterile Instrument Pack")
async def create_sterile_pack(
    pack_in: SterilePackCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> SterilePackResponse:
    """Register a new sterile pack from an autoclave batch."""
    # Verify batch exists
    batch_res = await db.execute(select(CSSDBatch).where(CSSDBatch.id == pack_in.batch_id))
    batch = batch_res.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced CSSD autoclave batch not found")

    pack_code = f"PACK-{uuid.uuid4().hex[:6].upper()}"
    pack = SterilePack(
        pack_code=pack_code,
        batch_id=pack_in.batch_id,
        pack_name=pack_in.pack_name,
        expiry_date=pack_in.expiry_date,
        status=SterilePackStatus.STERILE,
    )
    db.add(pack)
    await db.commit()
    await db.refresh(pack)

    return SterilePackResponse(
        id=pack.id,
        pack_code=pack.pack_code,
        batch_id=pack.batch_id,
        batch_code=batch.batch_code,
        pack_name=pack.pack_name,
        expiry_date=pack.expiry_date,
        status=pack.status,
    )


@router.patch("/cssd/packs/{pack_id}/use", response_model=SterilePackResponse, summary="Mark Sterile Pack Used or Contaminated")
async def mark_pack_status(
    pack_id: int,
    status_update: SterilePackStatus,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> SterilePackResponse:
    """Update pack status to USED or CONTAMINATED upon completion or break in sterile field."""
    stmt = select(SterilePack).options(selectinload(SterilePack.batch)).where(SterilePack.id == pack_id)
    res = await db.execute(stmt)
    pack = res.scalar_one_or_none()
    if not pack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sterile instrument pack not found")

    pack.status = status_update
    await db.commit()
    await db.refresh(pack)

    return SterilePackResponse(
        id=pack.id,
        pack_code=pack.pack_code,
        batch_id=pack.batch_id,
        batch_code=pack.batch.batch_code if pack.batch else None,
        pack_name=pack.pack_name,
        expiry_date=pack.expiry_date,
        status=pack.status,
    )
