"""
Inpatient Department (IPD), Ward & Bed Occupancy Management endpoints.
Handles real-time bed census, patient ward admissions, bed-to-bed transfers,
housekeeping sanitization tracking, clinical discharge clearance, and printable vouchers.
"""
from datetime import date, datetime, timezone
import math
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_optional_current_user
from app.core.database import get_db
from app.models.inpatient import (
    AcuityLevel,
    AdmissionStatus,
    BedStatus,
    BedTransferLog,
    BedType,
    InpatientAdmission,
    Ward,
    WardBed,
)
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.schemas.inpatient import (
    BedTransferLogResponse,
    BedTransferRequest,
    InpatientAdmissionCreate,
    InpatientAdmissionResponse,
    InpatientDischargeRequest,
    InpatientDischargeVoucherResponse,
    InpatientStatsResponse,
    WardBedResponse,
    WardBedStatusUpdate,
    WardResponse,
    WardWithBedsResponse,
)

router = APIRouter()


def _calculate_age(birth_date: date) -> int:
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def _normalize_dt(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _build_bed_response(bed: WardBed) -> WardBedResponse:
    adm = bed.current_admission
    patient = adm.patient if adm else None
    return WardBedResponse(
        id=bed.id,
        ward_id=bed.ward_id,
        bed_number=bed.bed_number,
        bed_type=bed.bed_type,
        status=bed.status,
        daily_rate_etb=bed.daily_rate_etb,
        oxygen_supplied=bed.oxygen_supplied,
        has_monitor=bed.has_monitor,
        current_admission_id=bed.current_admission_id,
        ward_code=bed.ward.ward_code if bed.ward else None,
        ward_name_en=bed.ward.name_en if bed.ward else None,
        ward_name_om=bed.ward.name_om if bed.ward else None,
        patient_id=patient.id if patient else None,
        patient_name=f"{patient.first_name} {patient.last_name}" if patient else None,
        patient_mrn=patient.mrn if patient else None,
        admission_number=adm.admission_number if adm else None,
        acuity_level=adm.acuity_level if adm else None,
        admission_date=adm.admission_date if adm else None,
    )


def _build_admission_response(adm: InpatientAdmission) -> InpatientAdmissionResponse:
    patient = adm.patient
    doctor = adm.admitting_doctor
    nurse = adm.primary_nurse
    ward = adm.ward
    bed = adm.bed

    return InpatientAdmissionResponse(
        id=adm.id,
        admission_number=adm.admission_number,
        patient_id=adm.patient_id,
        patient_mrn=patient.mrn if patient else "UNKNOWN",
        patient_name=f"{patient.first_name} {patient.last_name}" if patient else "Unknown Patient",
        patient_gender=patient.gender.value if patient else "unknown",
        patient_age=_calculate_age(patient.birth_date) if patient else 30,
        ward_id=adm.ward_id,
        ward_name=ward.name_en if ward else "Ward",
        bed_id=adm.bed_id,
        bed_number=bed.bed_number if bed else "Bed",
        admitting_doctor_name=doctor.full_name if doctor else "Staff Clinician",
        primary_nurse_name=nurse.full_name if nurse else "Ward Duty Nurse",
        admitting_diagnosis=adm.admitting_diagnosis,
        icd10_code=adm.icd10_code,
        admission_type=adm.admission_type,
        acuity_level=adm.acuity_level,
        diet_category=adm.diet_category,
        payment_method=adm.payment_method,
        admission_date=adm.admission_date,
        discharge_date=adm.discharge_date,
        discharge_summary=adm.discharge_summary,
        discharge_condition=adm.discharge_condition,
        total_days=adm.total_days,
        total_bed_charge_etb=adm.total_bed_charge_etb,
        status=adm.status,
    )


@router.get("/stats", response_model=InpatientStatsResponse, summary="Get Inpatient Ward & Bed Census Statistics")
async def get_inpatient_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
):
    """
    Computes real-time hospital inpatient capacity, occupied beds, available beds,
    cleaning turnover queues, and overall Bed Occupancy Rate (BOR).
    """
    # Count beds by status
    beds_query = select(WardBed.status, func.count(WardBed.id)).group_by(WardBed.status)
    beds_result = await db.execute(beds_query)
    bed_counts = {row[0]: row[1] for row in beds_result.all()}

    total_beds = sum(bed_counts.values())
    occupied_beds = bed_counts.get("occupied", 0)
    available_beds = bed_counts.get("available", 0)
    cleaning_beds = bed_counts.get("cleaning", 0)
    maintenance_beds = bed_counts.get("maintenance", 0)

    occupancy_rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0

    # Count active admissions
    active_adm_query = select(func.count(InpatientAdmission.id)).where(InpatientAdmission.status == "admitted")
    active_admissions = (await db.execute(active_adm_query)).scalar() or 0

    # Count critical patients
    critical_query = select(func.count(InpatientAdmission.id)).where(
        InpatientAdmission.status == "admitted",
        InpatientAdmission.acuity_level == "critical",
    )
    critical_count = (await db.execute(critical_query)).scalar() or 0

    # Today admissions & discharges
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_adm_query = select(func.count(InpatientAdmission.id)).where(InpatientAdmission.admission_date >= today_start)
    today_adm_count = (await db.execute(today_adm_query)).scalar() or 0

    today_disch_query = select(func.count(InpatientAdmission.id)).where(
        InpatientAdmission.discharge_date.isnot(None),
        InpatientAdmission.discharge_date >= today_start,
    )
    today_disch_count = (await db.execute(today_disch_query)).scalar() or 0

    return InpatientStatsResponse(
        total_beds=total_beds,
        occupied_beds=occupied_beds,
        available_beds=available_beds,
        cleaning_beds=cleaning_beds,
        maintenance_beds=maintenance_beds,
        overall_occupancy_rate=occupancy_rate,
        active_admissions_count=active_admissions,
        critical_patients_count=critical_count,
        today_admissions_count=today_adm_count,
        today_discharges_count=today_disch_count,
    )


@router.get("/wards", response_model=List[WardWithBedsResponse], summary="List Hospital Wards with Beds")
async def list_wards(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
):
    """
    List all clinical hospital wards with bed breakdown, current occupancy, and occupancy rate.
    """
    query = (
        select(Ward)
        .options(
            selectinload(Ward.beds).selectinload(WardBed.current_admission).selectinload(InpatientAdmission.patient),
            selectinload(Ward.beds).selectinload(WardBed.ward),
        )
        .order_by(Ward.id)
    )
    result = await db.execute(query)
    wards = result.scalars().all()

    ward_responses = []
    for ward in wards:
        total_beds = len(ward.beds)
        occupied_beds = sum(1 for b in ward.beds if b.status == "occupied")
        available_beds = sum(1 for b in ward.beds if b.status == "available")
        cleaning_beds = sum(1 for b in ward.beds if b.status == "cleaning")
        maintenance_beds = sum(1 for b in ward.beds if b.status == "maintenance")
        occ_rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0

        bed_items = [_build_bed_response(b) for b in ward.beds]

        ward_responses.append(
            WardWithBedsResponse(
                id=ward.id,
                ward_code=ward.ward_code,
                name_en=ward.name_en,
                name_om=ward.name_om,
                department=ward.department,
                floor_location=ward.floor_location,
                head_nurse=ward.head_nurse,
                is_active=ward.is_active,
                total_beds=total_beds,
                occupied_beds=occupied_beds,
                available_beds=available_beds,
                cleaning_beds=cleaning_beds,
                maintenance_beds=maintenance_beds,
                occupancy_rate=occ_rate,
                beds=bed_items,
            )
        )

    return ward_responses


@router.get("/beds", response_model=List[WardBedResponse], summary="List Hospital Beds with Filters")
async def list_beds(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
    ward_id: Optional[int] = Query(None, description="Filter by Ward ID"),
    status: Optional[str] = Query(None, description="Filter by bed status"),
    bed_type: Optional[str] = Query(None, description="Filter by bed type"),
):
    """
    Get detailed list of beds across all wards or filtered by ward and status.
    """
    query = (
        select(WardBed)
        .options(
            selectinload(WardBed.ward),
            selectinload(WardBed.current_admission).selectinload(InpatientAdmission.patient),
        )
        .order_by(WardBed.ward_id, WardBed.bed_number)
    )

    if ward_id:
        query = query.where(WardBed.ward_id == ward_id)
    if status and status != "all":
        query = query.where(WardBed.status == status)
    if bed_type and bed_type != "all":
        query = query.where(WardBed.bed_type == bed_type)

    result = await db.execute(query)
    beds = result.scalars().all()
    return [_build_bed_response(b) for b in beds]


@router.patch("/beds/{bed_id}/status", response_model=WardBedResponse, summary="Update Bed Status (Cleaning/Maintenance)")
async def update_bed_status(
    bed_id: int,
    payload: WardBedStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
):
    """
    Update bed housekeeping status (e.g. mark bed as cleaned & available, or under maintenance).
    """
    query = (
        select(WardBed)
        .options(
            selectinload(WardBed.ward),
            selectinload(WardBed.current_admission).selectinload(InpatientAdmission.patient),
        )
        .where(WardBed.id == bed_id)
    )
    result = await db.execute(query)
    bed = result.scalar_one_or_none()
    if not bed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bed not found")

    valid_statuses = ["available", "occupied", "cleaning", "maintenance", "reserved"]
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid bed status. Allowed: {valid_statuses}",
        )

    # If transitioning to available, make sure no active admission remains linked
    if payload.status == "available" and bed.current_admission_id:
        bed.current_admission_id = None

    bed.status = payload.status
    await db.commit()
    await db.refresh(bed)
    return _build_bed_response(bed)


@router.get("/admissions", response_model=List[InpatientAdmissionResponse], summary="List Inpatient Admissions")
async def list_admissions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
    status: Optional[str] = Query(None, description="admitted, discharged, or all"),
    ward_id: Optional[int] = Query(None, description="Filter by Ward ID"),
    acuity_level: Optional[str] = Query(None, description="Filter by Acuity level"),
    search: Optional[str] = Query(None, description="Search MRN or diagnosis"),
):
    """
    List patient admissions with sorting (critical acuity first) and filtering.
    """
    query = (
        select(InpatientAdmission)
        .options(
            selectinload(InpatientAdmission.patient),
            selectinload(InpatientAdmission.ward),
            selectinload(InpatientAdmission.bed),
            selectinload(InpatientAdmission.admitting_doctor),
            selectinload(InpatientAdmission.primary_nurse),
        )
    )

    if status and status != "all":
        query = query.where(InpatientAdmission.status == status)
    else:
        # Default to admitted active patients
        query = query.where(InpatientAdmission.status == "admitted")

    if ward_id:
        query = query.where(InpatientAdmission.ward_id == ward_id)
    if acuity_level and acuity_level != "all":
        query = query.where(InpatientAdmission.acuity_level == acuity_level)

    # Acuity ranking: critical = 1, high = 2, moderate = 3, stable = 4
    acuity_rank = case(
        (InpatientAdmission.acuity_level == "critical", 1),
        (InpatientAdmission.acuity_level == "high", 2),
        (InpatientAdmission.acuity_level == "moderate", 3),
        else_=4,
    )
    query = query.order_by(acuity_rank, InpatientAdmission.admission_date.desc())

    result = await db.execute(query)
    admissions = result.scalars().all()

    if search:
        search_lower = search.lower()
        admissions = [
            a for a in admissions
            if (a.patient and (search_lower in a.patient.first_name.lower() or search_lower in a.patient.last_name.lower() or search_lower in a.patient.mrn.lower()))
            or (search_lower in a.admission_number.lower())
            or (search_lower in a.admitting_diagnosis.lower())
        ]

    return [_build_admission_response(a) for a in admissions]


@router.post("/admissions", response_model=InpatientAdmissionResponse, status_code=status.HTTP_201_CREATED, summary="Admit Patient to Ward")
async def create_admission(
    payload: InpatientAdmissionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
):
    """
    Admit a patient to a specified ward and bed.
    Validates bed availability, sets bed status to 'occupied', and records the admission.
    """
    # Verify patient exists
    pat_res = await db.execute(select(Patient).where(Patient.id == payload.patient_id))
    patient = pat_res.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Verify ward exists
    ward_res = await db.execute(select(Ward).where(Ward.id == payload.ward_id))
    ward = ward_res.scalar_one_or_none()
    if not ward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")

    # Verify bed exists and is available
    bed_res = await db.execute(select(WardBed).where(WardBed.id == payload.bed_id))
    bed = bed_res.scalar_one_or_none()
    if not bed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bed not found")

    if bed.status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bed {bed.bed_number} is currently '{bed.status}'. Only available beds can accept admissions.",
        )

    # Generate unique admission number
    now = datetime.now(timezone.utc)
    short_uuid = uuid.uuid4().hex[:6].upper()
    admission_number = f"ADM-{now.year}-{short_uuid}"

    # Default doctor/nurse if not provided
    doc_id = payload.admitting_doctor_id or (current_user.id if current_user and current_user.role in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN] else None)
    if not doc_id:
        doc_q = await db.execute(select(User).where(User.role == UserRole.DOCTOR).limit(1))
        first_doc = doc_q.scalar_one_or_none()
        if first_doc:
            doc_id = first_doc.id

    nurse_id = payload.primary_nurse_id
    if not nurse_id:
        nurse_q = await db.execute(select(User).where(User.role == UserRole.NURSE).limit(1))
        first_nurse = nurse_q.scalar_one_or_none()
        if first_nurse:
            nurse_id = first_nurse.id

    new_adm = InpatientAdmission(
        admission_number=admission_number,
        patient_id=payload.patient_id,
        ward_id=payload.ward_id,
        bed_id=payload.bed_id,
        admitting_doctor_id=doc_id,
        primary_nurse_id=nurse_id,
        admitting_diagnosis=payload.admitting_diagnosis,
        icd10_code=payload.icd10_code,
        admission_type=payload.admission_type,
        acuity_level=payload.acuity_level,
        diet_category=payload.diet_category,
        payment_method=payload.payment_method,
        admission_date=now,
        status="admitted",
        total_days=0,
        total_bed_charge_etb=0.0,
    )
    db.add(new_adm)
    await db.flush()

    # Update bed state
    bed.status = "occupied"
    bed.current_admission_id = new_adm.id
    await db.commit()

    # Re-fetch with all eager relationships
    refetched = await db.execute(
        select(InpatientAdmission)
        .options(
            selectinload(InpatientAdmission.patient),
            selectinload(InpatientAdmission.ward),
            selectinload(InpatientAdmission.bed),
            selectinload(InpatientAdmission.admitting_doctor),
            selectinload(InpatientAdmission.primary_nurse),
        )
        .where(InpatientAdmission.id == new_adm.id)
    )
    return _build_admission_response(refetched.scalar_one())


@router.post("/admissions/{admission_id}/transfer", response_model=InpatientAdmissionResponse, summary="Transfer Patient to New Bed/Ward")
async def transfer_patient(
    admission_id: int,
    payload: BedTransferRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
):
    """
    Transfer an admitted patient to a new bed or ward.
    Frees the current bed (marks as cleaning), marks the new bed as occupied,
    updates the admission record, and logs the transfer.
    """
    adm_q = await db.execute(
        select(InpatientAdmission)
        .options(
            selectinload(InpatientAdmission.bed),
            selectinload(InpatientAdmission.ward),
            selectinload(InpatientAdmission.patient),
        )
        .where(InpatientAdmission.id == admission_id)
    )
    admission = adm_q.scalar_one_or_none()
    if not admission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")

    if admission.status != "admitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transfer patient with status '{admission.status}'. Only actively admitted patients can be transferred.",
        )

    # Check target bed
    new_bed_q = await db.execute(select(WardBed).where(WardBed.id == payload.to_bed_id))
    new_bed = new_bed_q.scalar_one_or_none()
    if not new_bed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target bed not found")

    if new_bed.status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target bed {new_bed.bed_number} is '{new_bed.status}'. It must be available for transfer.",
        )

    # Old bed & ward
    old_bed = admission.bed
    old_ward_id = admission.ward_id
    old_bed_id = admission.bed_id

    # Create transfer log
    trans_by_id = current_user.id if current_user else None
    transfer_log = BedTransferLog(
        admission_id=admission.id,
        from_ward_id=old_ward_id,
        from_bed_id=old_bed_id,
        to_ward_id=payload.to_ward_id,
        to_bed_id=payload.to_bed_id,
        transferred_by_id=trans_by_id,
        transfer_reason=payload.transfer_reason,
        transferred_at=datetime.now(timezone.utc),
    )
    db.add(transfer_log)

    # Release old bed -> set to cleaning
    if old_bed:
        old_bed.status = "cleaning"
        old_bed.current_admission_id = None

    # Occupy new bed
    new_bed.status = "occupied"
    new_bed.current_admission_id = admission.id

    # Update admission
    admission.ward_id = payload.to_ward_id
    admission.bed_id = payload.to_bed_id

    await db.commit()

    # Re-fetch
    refetched = await db.execute(
        select(InpatientAdmission)
        .options(
            selectinload(InpatientAdmission.patient),
            selectinload(InpatientAdmission.ward),
            selectinload(InpatientAdmission.bed),
            selectinload(InpatientAdmission.admitting_doctor),
            selectinload(InpatientAdmission.primary_nurse),
        )
        .where(InpatientAdmission.id == admission.id)
    )
    return _build_admission_response(refetched.scalar_one())


@router.post("/admissions/{admission_id}/discharge", response_model=InpatientAdmissionResponse, summary="Clinical Discharge Clearance")
async def discharge_patient(
    admission_id: int,
    payload: InpatientDischargeRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
):
    """
    Clinically discharges an inpatient.
    Calculates stay duration (Length of Stay - LOS), computes total bed charges,
    releases bed to 'cleaning' status, and stores discharge summary notes.
    """
    adm_q = await db.execute(
        select(InpatientAdmission)
        .options(
            selectinload(InpatientAdmission.bed),
            selectinload(InpatientAdmission.ward),
            selectinload(InpatientAdmission.patient),
        )
        .where(InpatientAdmission.id == admission_id)
    )
    admission = adm_q.scalar_one_or_none()
    if not admission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")

    if admission.status != "admitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient is already {admission.status}.",
        )

    now = datetime.now(timezone.utc)
    admission.discharge_date = now
    admission.discharge_summary = payload.discharge_summary
    admission.discharge_condition = payload.discharge_condition
    admission.status = "discharged" if payload.discharge_condition != "deceased" else "deceased"

    doc_id = current_user.id if current_user and current_user.role in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN] else admission.admitting_doctor_id
    admission.discharge_doctor_id = doc_id

    # Calculate stay days
    adm_dt = _normalize_dt(admission.admission_date)
    now_naive = datetime.utcnow()
    delta_seconds = max(0.0, (now_naive - adm_dt).total_seconds())
    calculated_days = max(1, math.ceil(delta_seconds / 86400))
    admission.total_days = calculated_days

    # Calculate bed charges
    daily_rate = admission.bed.daily_rate_etb if admission.bed else 150.0
    admission.total_bed_charge_etb = round(calculated_days * daily_rate, 2)

    # Release bed and transition to cleaning
    if admission.bed:
        admission.bed.status = "cleaning"
        admission.bed.current_admission_id = None

    await db.commit()

    refetched = await db.execute(
        select(InpatientAdmission)
        .options(
            selectinload(InpatientAdmission.patient),
            selectinload(InpatientAdmission.ward),
            selectinload(InpatientAdmission.bed),
            selectinload(InpatientAdmission.admitting_doctor),
            selectinload(InpatientAdmission.primary_nurse),
        )
        .where(InpatientAdmission.id == admission.id)
    )
    return _build_admission_response(refetched.scalar_one())


@router.get("/admissions/{admission_id}/voucher", response_model=InpatientDischargeVoucherResponse, summary="Get Inpatient Summary Voucher")
async def get_discharge_voucher(
    admission_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
):
    """
    Generate official hospital Inpatient Admission & Discharge Summary voucher
    with letterhead, TIN 0038912401, QR verification, and attending clinician sign-off.
    """
    adm_q = await db.execute(
        select(InpatientAdmission)
        .options(
            selectinload(InpatientAdmission.bed),
            selectinload(InpatientAdmission.ward),
            selectinload(InpatientAdmission.patient),
            selectinload(InpatientAdmission.admitting_doctor),
            selectinload(InpatientAdmission.discharge_doctor),
        )
        .where(InpatientAdmission.id == admission_id)
    )
    adm = adm_q.scalar_one_or_none()
    if not adm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")

    patient = adm.patient
    ward = adm.ward
    bed = adm.bed
    doctor = adm.discharge_doctor or adm.admitting_doctor

    now = datetime.now(timezone.utc)
    discharge_dt = adm.discharge_date or now
    adm_norm = _normalize_dt(adm.admission_date)
    disch_norm = _normalize_dt(discharge_dt)
    stay_days = adm.total_days if adm.total_days > 0 else max(1, math.ceil(max(0.0, (disch_norm - adm_norm).total_seconds()) / 86400))
    daily_rate = bed.daily_rate_etb if bed else 150.0
    bed_charge = adm.total_bed_charge_etb if adm.total_bed_charge_etb > 0 else round(stay_days * daily_rate, 2)

    qr_payload = f"MKH-IPD|ADM:{adm.admission_number}|MRN:{patient.mrn}|WARD:{ward.ward_code}|DAYS:{stay_days}|TIN:0038912401"

    return InpatientDischargeVoucherResponse(
        hospital_name_en="Mettu Karl Comprehensive Specialized Hospital",
        hospital_name_om="Hospitaala Waliigalaa Ispeeshaalaayizdii Karl Mattuu",
        tin_number="0038912401",
        accreditation_level="Level 4 Specialized Inpatient Care",
        telephone="+251 47 441 2345",
        location="Mettu, Illubabor Zone, Oromia, Ethiopia",
        admission_number=adm.admission_number,
        admission_date=adm.admission_date,
        discharge_date=discharge_dt,
        total_stay_days=stay_days,
        daily_rate_etb=daily_rate,
        total_bed_charge_etb=bed_charge,
        patient_mrn=patient.mrn if patient else "UNKNOWN",
        patient_name=f"{patient.first_name} {patient.last_name}" if patient else "Patient",
        patient_age=_calculate_age(patient.birth_date) if patient else 30,
        patient_gender=patient.gender.value.upper() if patient else "UNKNOWN",
        patient_address=f"{patient.address_line or ''}, {patient.city or 'Mettu'}, {patient.state_province or 'Oromia'}",
        ward_name=ward.name_en if ward else "Inpatient Ward",
        bed_number=bed.bed_number if bed else "Bed",
        payment_category=adm.payment_method.upper(),
        admitting_diagnosis=adm.admitting_diagnosis,
        icd10_code=adm.icd10_code,
        discharge_summary=adm.discharge_summary or "Patient completed inpatient clinical treatment course and achieved clinical stabilization. Discharged with follow-up outpatient appointment.",
        discharge_condition=adm.discharge_condition or "Cured & Improved",
        attending_physician=doctor.full_name if doctor else "Dr. Bekele Gemechu (Consultant Physician)",
        issued_timestamp=now,
        verification_qr=qr_payload,
    )


@router.get("/transfers", response_model=List[BedTransferLogResponse], summary="List Bed Transfer Audit Logs")
async def list_transfers(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)],
    limit: int = Query(25, ge=1, le=100),
):
    """
    Get recent internal ward and bed transfer logs for infection control and bed census auditing.
    """
    query = (
        select(BedTransferLog)
        .options(
            selectinload(BedTransferLog.admission).selectinload(InpatientAdmission.patient),
            selectinload(BedTransferLog.from_ward),
            selectinload(BedTransferLog.from_bed),
            selectinload(BedTransferLog.to_ward),
            selectinload(BedTransferLog.to_bed),
            selectinload(BedTransferLog.transferred_by),
        )
        .order_by(BedTransferLog.transferred_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        BedTransferLogResponse(
            id=l.id,
            admission_id=l.admission_id,
            admission_number=l.admission.admission_number if l.admission else "UNKNOWN",
            patient_name=f"{l.admission.patient.first_name} {l.admission.patient.last_name}" if (l.admission and l.admission.patient) else "Unknown",
            from_ward_name=l.from_ward.name_en if l.from_ward else "Ward",
            from_bed_number=l.from_bed.bed_number if l.from_bed else "Bed",
            to_ward_name=l.to_ward.name_en if l.to_ward else "Ward",
            to_bed_number=l.to_bed.bed_number if l.to_bed else "Bed",
            transferred_by_name=l.transferred_by.full_name if l.transferred_by else "Clinical Supervisor",
            transfer_reason=l.transfer_reason,
            transferred_at=l.transferred_at,
        )
        for l in logs
    ]
