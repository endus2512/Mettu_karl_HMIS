"""
PACS / RIS Radiology Imaging endpoints.
Manages physician imaging requisitions, DICOM study indexing, web viewer controls,
radiologist narrative reporting, and printable diagnostic imaging vouchers.
"""
from datetime import date, datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_optional_current_user
from app.core.database import get_db
from app.models.pacs import (
    DICOMInstance,
    DICOMSeries,
    DICOMStudy,
    ModalityType,
    RadiologyOrder,
    RadiologyStatus,
)
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.schemas.pacs import (
    DICOMInstanceResponse,
    DICOMStudyCreate,
    DICOMStudyResponse,
    PACSStatsResponse,
    RadiologyOrderCreate,
    RadiologyOrderResponse,
    RadiologyReportSubmit,
)
from app.services.pacs_service import (
    get_dicom_viewer_presigned_url,
)

router = APIRouter()


def _calculate_age(birth_date: date) -> int:
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def _build_order_response(order: RadiologyOrder) -> RadiologyOrderResponse:
    patient = order.patient
    doctor = order.ordering_doctor

    p_age = _calculate_age(patient.birth_date) if patient and patient.birth_date else 35
    p_name = f"{patient.first_name} {patient.last_name}" if patient else "Unknown Patient"
    p_mrn = patient.mrn if patient else "UNKNOWN"
    p_gender = patient.gender.value if patient else "unknown"

    doc_name = f"Dr. {doctor.username.replace('dr_', '').capitalize()}" if doctor else "Attending Physician"

    return RadiologyOrderResponse(
        id=order.id,
        order_code=order.order_code,
        patient_id=order.patient_id,
        patient_mrn=p_mrn,
        patient_name=p_name,
        patient_gender=p_gender,
        patient_age=p_age,
        ordering_doctor_name=doc_name,
        modality=order.modality,
        body_part=order.body_part,
        clinical_indication=order.clinical_indication,
        priority=order.priority,
        status=order.status,
        ordered_at=order.ordered_at,
        has_study=order.study is not None,
        study_id=order.study.id if order.study else None,
    )


def _build_study_response(study: DICOMStudy) -> DICOMStudyResponse:
    patient = study.patient
    rep_doc = study.reporting_doctor

    p_age = _calculate_age(patient.birth_date) if patient and patient.birth_date else 35
    p_name = f"{patient.first_name} {patient.last_name}" if patient else "Unknown Patient"
    p_mrn = patient.mrn if patient else "UNKNOWN"
    p_gender = patient.gender.value if patient else "unknown"

    rep_name = f"Dr. {rep_doc.username.replace('dr_', '').capitalize()}" if rep_doc else "Dr. Bekele Gemechu (Consultant Radiologist)"

    return DICOMStudyResponse(
        id=study.id,
        study_instance_uid=study.study_instance_uid,
        radiology_order_id=study.radiology_order_id,
        patient_id=study.patient_id,
        patient_mrn=p_mrn,
        patient_name=p_name,
        patient_gender=p_gender,
        patient_age=p_age,
        modality=study.modality,
        study_description=study.study_description,
        study_datetime=study.study_datetime,
        radiologist_report=study.radiologist_report,
        clinical_impression=study.clinical_impression,
        is_critical_finding=study.is_critical_finding,
        image_url=study.image_url,
        window_width=study.window_width,
        window_level=study.window_level,
        slice_count=study.slice_count,
        reporting_doctor_name=rep_name,
        verified_at=study.verified_at,
    )


# -----------------------------------------------------------------------------
# 1. STATS / KPI
# -----------------------------------------------------------------------------

@router.get("/stats", response_model=PACSStatsResponse, summary="PACS Real-Time KPIs")
async def get_pacs_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> PACSStatsResponse:
    """Calculates operational metrics across imaging modalities and reporting queues."""
    total_q = select(func.count(DICOMStudy.id))
    pending_q = select(func.count(RadiologyOrder.id)).where(RadiologyOrder.status == RadiologyStatus.ORDERED)
    acquired_q = select(func.count(RadiologyOrder.id)).where(RadiologyOrder.status == RadiologyStatus.IMAGE_ACQUIRED)
    critical_q = select(func.count(DICOMStudy.id)).where(DICOMStudy.is_critical_finding == True)
    verified_q = select(func.count(DICOMStudy.id)).where(DICOMStudy.verified_at.isnot(None))

    total_studies = (await db.execute(total_q)).scalar_one() or 0
    pending_orders = (await db.execute(pending_q)).scalar_one() or 0
    acquired_today = (await db.execute(acquired_q)).scalar_one() or 0
    critical_findings = (await db.execute(critical_q)).scalar_one() or 0
    verified_reports = (await db.execute(verified_q)).scalar_one() or 0

    return PACSStatsResponse(
        total_studies_count=total_studies,
        pending_orders_count=pending_orders,
        acquired_today_count=acquired_today,
        critical_findings_count=critical_findings,
        verified_reports_count=verified_reports,
    )


# -----------------------------------------------------------------------------
# 2. RADIOLOGY ORDERS (RIS WORKLIST)
# -----------------------------------------------------------------------------

@router.get("/orders", response_model=List[RadiologyOrderResponse], summary="List Radiology Requisitions")
async def list_radiology_orders(
    status_filter: Optional[RadiologyStatus] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> List[RadiologyOrderResponse]:
    """Retrieve radiology orders prioritized with STAT and URGENT first."""
    priority_rank = case(
        (RadiologyOrder.priority == "stat", 1),
        (RadiologyOrder.priority == "urgent", 2),
        else_=3,
    )

    query = (
        select(RadiologyOrder)
        .options(
            selectinload(RadiologyOrder.patient),
            selectinload(RadiologyOrder.ordering_doctor),
            selectinload(RadiologyOrder.study),
        )
        .order_by(
            priority_rank.asc(),
            RadiologyOrder.ordered_at.desc(),
        )
    )

    if status_filter:
        query = query.where(RadiologyOrder.status == status_filter)
    if priority_filter and priority_filter != "all":
        query = query.where(RadiologyOrder.priority == priority_filter)

    result = await db.execute(query)
    orders = result.scalars().all()

    if search:
        s_lower = search.lower().strip()
        filtered = []
        for o in orders:
            p_name = f"{o.patient.first_name} {o.patient.last_name}".lower() if o.patient else ""
            p_mrn = o.patient.mrn.lower() if o.patient else ""
            o_code = o.order_code.lower()
            b_part = o.body_part.lower()
            if s_lower in p_name or s_lower in p_mrn or s_lower in o_code or s_lower in b_part:
                filtered.append(o)
        orders = filtered

    return [_build_order_response(o) for o in orders]


@router.post("/orders", response_model=RadiologyOrderResponse, status_code=status.HTTP_201_CREATED, summary="Create Radiology Requisition")
async def place_radiology_order(
    payload: RadiologyOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> RadiologyOrderResponse:
    """Physician requests an X-Ray, CT, MRI, or Ultrasound study."""
    pat_res = await db.execute(select(Patient).where(Patient.id == payload.patient_id))
    patient = pat_res.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    doc_id = current_user.id if current_user and current_user.role in [UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN] else 2
    code = f"RAD-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

    order = RadiologyOrder(
        order_code=code,
        patient_id=payload.patient_id,
        ordering_doctor_id=doc_id,
        modality=payload.modality,
        body_part=payload.body_part,
        clinical_indication=payload.clinical_indication,
        priority=payload.priority.lower(),
        status=RadiologyStatus.ORDERED,
        ordered_at=datetime.now(timezone.utc),
    )
    db.add(order)
    await db.commit()

    # Re-fetch with relations
    stmt = (
        select(RadiologyOrder)
        .where(RadiologyOrder.id == order.id)
        .options(
            selectinload(RadiologyOrder.patient),
            selectinload(RadiologyOrder.ordering_doctor),
            selectinload(RadiologyOrder.study),
        )
    )
    res = await db.execute(stmt)
    loaded = res.scalar_one()

    return _build_order_response(loaded)


# -----------------------------------------------------------------------------
# 3. DICOM STUDIES & VIEWER
# -----------------------------------------------------------------------------

@router.get("/studies", response_model=List[DICOMStudyResponse], summary="List DICOM Studies")
async def list_dicom_studies(
    patient_id: Optional[int] = None,
    modality: Optional[ModalityType] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> List[DICOMStudyResponse]:
    """Retrieve indexed radiology imaging studies with radiologist impressions."""
    query = (
        select(DICOMStudy)
        .options(
            selectinload(DICOMStudy.patient),
            selectinload(DICOMStudy.reporting_doctor),
        )
        .order_by(DICOMStudy.study_datetime.desc())
    )

    if patient_id:
        query = query.where(DICOMStudy.patient_id == patient_id)
    if modality:
        query = query.where(DICOMStudy.modality == modality)

    result = await db.execute(query)
    studies = result.scalars().all()

    if search:
        s_lower = search.lower().strip()
        filtered = []
        for s in studies:
            p_name = f"{s.patient.first_name} {s.patient.last_name}".lower() if s.patient else ""
            p_mrn = s.patient.mrn.lower() if s.patient else ""
            s_uid = s.study_instance_uid.lower()
            s_desc = s.study_description.lower()
            if s_lower in p_name or s_lower in p_mrn or s_lower in s_uid or s_lower in s_desc:
                filtered.append(s)
        studies = filtered

    return [_build_study_response(s) for s in studies]


@router.get("/studies/{study_id}", response_model=DICOMStudyResponse, summary="Get Single DICOM Study")
async def get_dicom_study(
    study_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> DICOMStudyResponse:
    """Retrieve complete metadata and radiologist findings for a specific study."""
    stmt = (
        select(DICOMStudy)
        .where(DICOMStudy.id == study_id)
        .options(
            selectinload(DICOMStudy.patient),
            selectinload(DICOMStudy.reporting_doctor),
        )
    )
    res = await db.execute(stmt)
    study = res.scalar_one_or_none()
    if not study:
        raise HTTPException(status_code=404, detail="DICOM Study not found")

    return _build_study_response(study)


@router.post("/studies", response_model=DICOMStudyResponse, status_code=status.HTTP_201_CREATED, summary="Ingest DICOM Study")
async def create_study(
    payload: DICOMStudyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> DICOMStudyResponse:
    """Ingest metadata and image reference from an X-Ray, CT, or Ultrasound scanner."""
    study_uid = f"1.2.826.0.1.3680043.9.7129.{uuid.uuid4().int % 100000000000}"
    study_time = payload.study_datetime or datetime.now(timezone.utc)

    new_study = DICOMStudy(
        study_instance_uid=study_uid,
        radiology_order_id=payload.radiology_order_id,
        patient_id=payload.patient_id,
        modality=payload.modality,
        study_description=payload.study_description,
        study_datetime=study_time,
        image_url=payload.image_url,
        slice_count=payload.slice_count,
        window_width=payload.window_width,
        window_level=payload.window_level,
    )
    db.add(new_study)

    # Link order if present
    if payload.radiology_order_id:
        ord_res = await db.execute(select(RadiologyOrder).where(RadiologyOrder.id == payload.radiology_order_id))
        order = ord_res.scalar_one_or_none()
        if order:
            order.status = RadiologyStatus.IMAGE_ACQUIRED

    await db.commit()

    # Re-fetch
    stmt = (
        select(DICOMStudy)
        .where(DICOMStudy.id == new_study.id)
        .options(
            selectinload(DICOMStudy.patient),
            selectinload(DICOMStudy.reporting_doctor),
        )
    )
    res = await db.execute(stmt)
    loaded = res.scalar_one()

    return _build_study_response(loaded)


@router.post("/studies/{study_id}/report", response_model=DICOMStudyResponse, summary="Sign Radiologist Report")
async def record_radiologist_report(
    study_id: int,
    payload: RadiologyReportSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> DICOMStudyResponse:
    """Radiologist logs narrative report, clinical impression, flags critical findings, and signs off."""
    stmt = (
        select(DICOMStudy)
        .where(DICOMStudy.id == study_id)
        .options(
            selectinload(DICOMStudy.patient),
            selectinload(DICOMStudy.reporting_doctor),
            selectinload(DICOMStudy.order),
        )
    )
    res = await db.execute(stmt)
    study = res.scalar_one_or_none()
    if not study:
        raise HTTPException(status_code=404, detail="DICOM Study not found")

    doctor_id = current_user.id if current_user else 2 # Dr. Bekele
    now = datetime.now(timezone.utc)

    study.radiologist_report = payload.radiologist_report
    study.clinical_impression = payload.clinical_impression
    study.is_critical_finding = payload.is_critical_finding
    study.reporting_doctor_id = doctor_id
    study.verified_at = now

    if study.order:
        study.order.status = RadiologyStatus.VERIFIED

    await db.commit()

    # Re-query
    stmt_reload = (
        select(DICOMStudy)
        .where(DICOMStudy.id == study_id)
        .options(
            selectinload(DICOMStudy.patient),
            selectinload(DICOMStudy.reporting_doctor),
        )
    )
    res_reload = await db.execute(stmt_reload)
    updated = res_reload.scalar_one()

    return _build_study_response(updated)


@router.get("/studies/{study_id}/report-voucher", summary="Printable Diagnostic Imaging Report Voucher")
async def get_imaging_report_voucher(
    study_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Generates official structured diagnostic imaging report suitable for hospital discharge and referral."""
    stmt = (
        select(DICOMStudy)
        .where(DICOMStudy.id == study_id)
        .options(
            selectinload(DICOMStudy.patient),
            selectinload(DICOMStudy.reporting_doctor),
            selectinload(DICOMStudy.order),
        )
    )
    res = await db.execute(stmt)
    study = res.scalar_one_or_none()
    if not study:
        raise HTTPException(status_code=404, detail="DICOM Study not found")

    study_resp = _build_study_response(study)

    return {
        "hospital_header": {
            "name_en": "Mettu Karl Comprehensive Specialized Hospital",
            "name_om": "Hospitaala Waliigalaa Ispeeshaalaayizdii Karl Mattuu",
            "department": "Department of Radiology & Diagnostic Imaging (PACS/RIS)",
            "accreditation": "Ethiopian Standards Agency Level 4 Hospital / National Radiation Authority Licensed",
            "address": "Mettu, Illubabor Zone, Oromia, Ethiopia",
            "phone": "+251 47 441 2345",
            "tin_number": "0038912401",
        },
        "study": study_resp.model_dump(),
        "verification_badge": {
            "qr_payload": f"MKH-RAD-VERIFY:{study.study_instance_uid}:{study.patient.mrn}:{study.modality.value}",
            "verified_by": study_resp.reporting_doctor_name or "Dr. Bekele Gemechu (Consultant Radiologist)",
            "verification_timestamp": study.verified_at.isoformat() if study.verified_at else None,
            "has_critical_alert": study.is_critical_finding,
        },
    }
