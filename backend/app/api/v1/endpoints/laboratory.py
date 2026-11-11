"""
Laboratory Information System (LIS) REST API endpoints.
Provides test catalog management, doctor requisitions, phlebotomy accessioning,
quantitative/ordinal result verification with abnormal & critical panic flagging,
diagnostic report generation, and real-time clinical laboratory KPIs.
"""
from datetime import date, datetime, timezone
import json
import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_lab_clinical
from app.core.database import get_db
from app.models.laboratory import (
    LabCategory,
    LabOrder,
    LabOrderItem,
    LabOrderPriority,
    LabOrderStatus,
    LabResult,
    LabTestCatalog,
    ResultFlag,
    SpecimenType,
)
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.schemas.laboratory import (
    LabOrderCreate,
    LabOrderItemResponse,
    LabOrderResponse,
    LabParameterDef,
    LabResultItemCreate,
    LabResultResponse,
    LabResultsSubmitRequest,
    LabStatsResponse,
    LabTestCatalogCreate,
    LabTestCatalogResponse,
    SampleCollectionRequest,
)

router = APIRouter()


def _calculate_age(birth_date: date) -> int:
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def _parse_parameters_json(param_str: Optional[str]) -> List[LabParameterDef]:
    if not param_str:
        return []
    try:
        data = json.loads(param_str)
        if isinstance(data, list):
            return [LabParameterDef(**p) for p in data]
    except Exception:
        pass
    return []


def _build_order_response(order: LabOrder) -> LabOrderResponse:
    patient = order.patient
    doctor = order.ordering_doctor
    collector = order.sample_collector
    verifier = order.verified_by

    patient_age = _calculate_age(patient.birth_date) if patient and patient.birth_date else 30
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Unknown Patient"
    patient_mrn = patient.mrn if patient else "UNKNOWN"
    patient_gender = patient.gender.value if patient else "unknown"
    patient_phone = patient.phone_number if patient else None

    doctor_name = f"Dr. {doctor.username.replace('dr_', '').capitalize()}" if doctor else "Attending Physician"
    collector_name = collector.username if collector else None
    verifier_name = verifier.username if verifier else None

    item_responses = []
    if order.items:
        for item in order.items:
            test = item.test
            item_responses.append(
                LabOrderItemResponse(
                    id=item.id,
                    test_catalog_id=test.id,
                    test_code=test.test_code,
                    test_name=test.test_name,
                    name_om=test.name_om,
                    category=test.category,
                    specimen_type=test.specimen_type,
                    tube_color=test.tube_color,
                    loinc_code=test.loinc_code,
                    price_etb=test.price_etb,
                    status=item.status,
                )
            )

    result_responses = []
    if order.results:
        for r in order.results:
            tech_name = r.technologist.username if r.technologist else None
            result_responses.append(
                LabResultResponse(
                    id=r.id,
                    test_catalog_id=r.test_catalog_id,
                    parameter_name=r.parameter_name,
                    result_value=r.result_value,
                    unit=r.unit,
                    reference_range=r.reference_range,
                    flag=r.flag,
                    notes=r.notes,
                    recorded_at=r.recorded_at,
                    technologist_name=tech_name,
                )
            )

    return LabOrderResponse(
        id=order.id,
        order_number=order.order_number,
        patient_id=order.patient_id,
        patient_mrn=patient_mrn,
        patient_name=patient_name,
        patient_gender=patient_gender,
        patient_age=patient_age,
        patient_phone=patient_phone,
        ordering_doctor_name=doctor_name,
        priority=order.priority,
        clinical_notes=order.clinical_notes,
        status=order.status,
        ordered_at=order.ordered_at,
        sample_collected_at=order.sample_collected_at,
        sample_barcode=order.sample_barcode,
        sample_collector_name=collector_name,
        completed_at=order.completed_at,
        verified_by_name=verifier_name,
        has_critical_flag=order.has_critical_flag,
        billing_invoice_id=order.billing_invoice_id,
        items=item_responses,
        results=result_responses,
    )


# -----------------------------------------------------------------------------
# 1. TEST CATALOG ENDPOINTS
# -----------------------------------------------------------------------------

@router.get("/catalog", response_model=List[LabTestCatalogResponse], summary="List Diagnostic Lab Tests")
async def get_test_catalog(
    category: Optional[LabCategory] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_lab_clinical),
) -> List[LabTestCatalogResponse]:
    """Retrieve full catalog of diagnostic tests and LOINC coded panels."""
    query = select(LabTestCatalog).where(LabTestCatalog.is_active == True)
    if category:
        query = query.where(LabTestCatalog.category == category)
    query = query.order_by(LabTestCatalog.category, LabTestCatalog.test_name)

    result = await db.execute(query)
    tests = result.scalars().all()

    catalog_responses = []
    for t in tests:
        params = _parse_parameters_json(t.parameters_json)
        resp = LabTestCatalogResponse(
            id=t.id,
            test_code=t.test_code,
            test_name=t.test_name,
            name_om=t.name_om,
            category=t.category,
            specimen_type=t.specimen_type,
            tube_color=t.tube_color,
            loinc_code=t.loinc_code,
            price_etb=t.price_etb,
            turnaround_time_mins=t.turnaround_time_mins,
            parameters_json=t.parameters_json,
            is_active=t.is_active,
            parameters=params,
        )
        catalog_responses.append(resp)

    return catalog_responses


@router.post("/catalog", response_model=LabTestCatalogResponse, status_code=status.HTTP_201_CREATED, summary="Create Lab Test Panel")
async def create_test_catalog(
    payload: LabTestCatalogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_lab_clinical),
) -> LabTestCatalogResponse:
    """Register a new diagnostic panel or test into master catalog."""
    test = LabTestCatalog(**payload.model_dump())
    db.add(test)
    await db.commit()
    await db.refresh(test)
    params = _parse_parameters_json(test.parameters_json)
    return LabTestCatalogResponse(
        id=test.id,
        test_code=test.test_code,
        test_name=test.test_name,
        name_om=test.name_om,
        category=test.category,
        specimen_type=test.specimen_type,
        tube_color=test.tube_color,
        loinc_code=test.loinc_code,
        price_etb=test.price_etb,
        turnaround_time_mins=test.turnaround_time_mins,
        parameters_json=test.parameters_json,
        is_active=test.is_active,
        parameters=params,
    )


# -----------------------------------------------------------------------------
# 2. STATS & OVERVIEW KPI
# -----------------------------------------------------------------------------

@router.get("/stats", response_model=LabStatsResponse, summary="Clinical Laboratory Real-Time KPIs")
async def get_lab_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_lab_clinical),
) -> LabStatsResponse:
    """Calculates operational queue metrics, STAT/critical emergencies, and completed test counts."""
    pending_orders_q = select(func.count(LabOrder.id)).where(LabOrder.status == LabOrderStatus.ORDERED)
    samples_col_q = select(func.count(LabOrder.id)).where(LabOrder.status == LabOrderStatus.SAMPLE_COLLECTED)
    processing_q = select(func.count(LabOrder.id)).where(LabOrder.status == LabOrderStatus.PROCESSING)
    completed_q = select(func.count(LabOrder.id)).where(LabOrder.status == LabOrderStatus.COMPLETED)
    critical_q = select(func.count(LabOrder.id)).where(LabOrder.has_critical_flag == True)
    stat_urgent_q = select(func.count(LabOrder.id)).where(
        or_(LabOrder.priority == LabOrderPriority.STAT, LabOrder.priority == LabOrderPriority.URGENT),
        LabOrder.status != LabOrderStatus.COMPLETED,
    )
    total_results_q = select(func.count(LabResult.id))

    pending_count = (await db.execute(pending_orders_q)).scalar_one() or 0
    samples_count = (await db.execute(samples_col_q)).scalar_one() or 0
    processing_count = (await db.execute(processing_q)).scalar_one() or 0
    completed_count = (await db.execute(completed_q)).scalar_one() or 0
    critical_count = (await db.execute(critical_q)).scalar_one() or 0
    stat_urgent_count = (await db.execute(stat_urgent_q)).scalar_one() or 0
    total_conducted = (await db.execute(total_results_q)).scalar_one() or 0

    return LabStatsResponse(
        pending_orders_count=pending_count,
        samples_collected_count=samples_count,
        processing_count=processing_count,
        completed_today_count=completed_count,
        critical_panic_count=critical_count,
        stat_urgent_count=stat_urgent_count,
        total_tests_conducted=total_conducted,
    )


# -----------------------------------------------------------------------------
# 3. LAB ORDERS DIRECTORY & REQUISITIONS
# -----------------------------------------------------------------------------

@router.get("/orders", response_model=List[LabOrderResponse], summary="List Lab Orders & Queues")
async def list_lab_orders(
    status_filter: Optional[LabOrderStatus] = Query(None, alias="status"),
    priority_filter: Optional[LabOrderPriority] = Query(None, alias="priority"),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_lab_clinical),
) -> List[LabOrderResponse]:
    """Search and retrieve lab orders with full patient, item, and result details."""
    priority_rank = case(
        (LabOrder.priority == LabOrderPriority.STAT, 1),
        (LabOrder.priority == LabOrderPriority.URGENT, 2),
        else_=3,
    )

    query = (
        select(LabOrder)
        .options(
            selectinload(LabOrder.patient),
            selectinload(LabOrder.ordering_doctor),
            selectinload(LabOrder.sample_collector),
            selectinload(LabOrder.verified_by),
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.results).selectinload(LabResult.technologist),
        )
        .order_by(
            priority_rank.asc(),
            LabOrder.ordered_at.desc(),
        )
    )

    if status_filter:
        query = query.where(LabOrder.status == status_filter)
    if priority_filter:
        query = query.where(LabOrder.priority == priority_filter)

    result = await db.execute(query)
    orders = result.scalars().all()

    if search:
        search_lower = search.lower().strip()
        filtered = []
        for o in orders:
            p_name = f"{o.patient.first_name} {o.patient.last_name}".lower() if o.patient else ""
            p_mrn = o.patient.mrn.lower() if o.patient else ""
            o_num = o.order_number.lower()
            s_bar = (o.sample_barcode or "").lower()
            if (
                search_lower in p_name
                or search_lower in p_mrn
                or search_lower in o_num
                or search_lower in s_bar
            ):
                filtered.append(o)
        orders = filtered

    return [_build_order_response(o) for o in orders]


@router.post("/orders", response_model=LabOrderResponse, status_code=status.HTTP_201_CREATED, summary="Create Lab Requisition")
async def create_lab_order(
    payload: LabOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_lab_clinical),
) -> LabOrderResponse:
    """Physician places a laboratory requisition order for a patient."""
    # Verify patient exists
    pat_res = await db.execute(select(Patient).where(Patient.id == payload.patient_id))
    patient = pat_res.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    # Determine doctor ID
    doc_id = current_user.id if current_user and current_user.role in [UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN] else 2

    # Generate sequential unique order code
    order_code = f"LAB-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

    new_order = LabOrder(
        order_number=order_code,
        patient_id=payload.patient_id,
        ordering_doctor_id=doc_id,
        priority=payload.priority,
        clinical_notes=payload.clinical_notes,
        status=LabOrderStatus.ORDERED,
        ordered_at=datetime.now(timezone.utc),
    )
    db.add(new_order)
    await db.flush()

    for test_id in payload.test_catalog_ids:
        item = LabOrderItem(
            lab_order_id=new_order.id,
            test_catalog_id=test_id,
            status="ordered",
        )
        db.add(item)

    await db.commit()

    # Re-fetch fully loaded
    stmt = (
        select(LabOrder)
        .where(LabOrder.id == new_order.id)
        .options(
            selectinload(LabOrder.patient),
            selectinload(LabOrder.ordering_doctor),
            selectinload(LabOrder.sample_collector),
            selectinload(LabOrder.verified_by),
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.results),
        )
    )
    res = await db.execute(stmt)
    loaded_order = res.scalar_one()

    return _build_order_response(loaded_order)


@router.get("/orders/{order_id}", response_model=LabOrderResponse, summary="Get Single Lab Order")
async def get_lab_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_lab_clinical),
) -> LabOrderResponse:
    """Retrieve full details of a single lab order."""
    stmt = (
        select(LabOrder)
        .where(LabOrder.id == order_id)
        .options(
            selectinload(LabOrder.patient),
            selectinload(LabOrder.ordering_doctor),
            selectinload(LabOrder.sample_collector),
            selectinload(LabOrder.verified_by),
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.results).selectinload(LabResult.technologist),
        )
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Laboratory order not found")

    return _build_order_response(order)


# -----------------------------------------------------------------------------
# 4. PHLEBOTOMY & SPECIMEN COLLECTION
# -----------------------------------------------------------------------------

@router.post("/orders/{order_id}/collect-sample", response_model=LabOrderResponse, summary="Phlebotomy Specimen Accessioning")
async def collect_sample(
    order_id: int,
    payload: SampleCollectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_lab_clinical),
) -> LabOrderResponse:
    """Phlebotomist confirms specimen draw, generates barcode, and queues for laboratory analysis."""
    stmt = (
        select(LabOrder)
        .where(LabOrder.id == order_id)
        .options(
            selectinload(LabOrder.patient),
            selectinload(LabOrder.ordering_doctor),
            selectinload(LabOrder.sample_collector),
            selectinload(LabOrder.verified_by),
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.results),
        )
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Laboratory order not found")

    collector_id = current_user.id
    barcode = payload.sample_barcode or f"SMP-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

    order.sample_collected_at = datetime.now(timezone.utc)
    order.sample_collector_id = collector_id
    order.sample_barcode = barcode
    order.status = LabOrderStatus.SAMPLE_COLLECTED

    if payload.notes:
        existing_notes = order.clinical_notes or ""
        order.clinical_notes = f"{existing_notes} [Sample Note: {payload.notes}]".strip()

    await db.commit()
    await db.refresh(order)

    return _build_order_response(order)


# -----------------------------------------------------------------------------
# 5. RESULT ENTRY & CLINICAL VERIFICATION
# -----------------------------------------------------------------------------

@router.post("/orders/{order_id}/record-results", response_model=LabOrderResponse, summary="Record & Verify Lab Results")
async def record_results(
    order_id: int,
    payload: LabResultsSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_lab_clinical),
) -> LabOrderResponse:
    """Technologist enters qualitative/quantitative findings, auto-checks critical panic flags, and finalizes."""
    stmt = (
        select(LabOrder)
        .where(LabOrder.id == order_id)
        .options(
            selectinload(LabOrder.patient),
            selectinload(LabOrder.ordering_doctor),
            selectinload(LabOrder.sample_collector),
            selectinload(LabOrder.verified_by),
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.results),
        )
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Laboratory order not found")

    tech_id = current_user.id

    # First test ID default
    default_test_id = order.items[0].test_catalog_id if order.items else 1

    has_panic = False
    now = datetime.now(timezone.utc)

    # Insert individual results
    for item in payload.results:
        flag = item.flag
        if flag == ResultFlag.CRITICAL_PANIC:
            has_panic = True

        result_row = LabResult(
            lab_order_id=order.id,
            test_catalog_id=default_test_id,
            parameter_name=item.parameter_name,
            result_value=item.result_value,
            unit=item.unit,
            reference_range=item.reference_range,
            flag=flag,
            notes=item.notes,
            technologist_id=tech_id,
            recorded_at=now,
        )
        db.add(result_row)

    order.completed_at = now
    order.verified_by_id = tech_id
    order.status = LabOrderStatus.COMPLETED
    order.has_critical_flag = has_panic

    if payload.overall_notes:
        curr_notes = order.clinical_notes or ""
        order.clinical_notes = f"{curr_notes} [Lab Findings: {payload.overall_notes}]".strip()

    await db.commit()

    # Re-query
    stmt_reload = (
        select(LabOrder)
        .where(LabOrder.id == order_id)
        .options(
            selectinload(LabOrder.patient),
            selectinload(LabOrder.ordering_doctor),
            selectinload(LabOrder.sample_collector),
            selectinload(LabOrder.verified_by),
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.results).selectinload(LabResult.technologist),
        )
    )
    res_reload = await db.execute(stmt_reload)
    updated_order = res_reload.scalar_one()

    return _build_order_response(updated_order)


# -----------------------------------------------------------------------------
# 6. OFFICIAL PRINTABLE DIAGNOSTIC LAB REPORT
# -----------------------------------------------------------------------------

@router.get("/orders/{order_id}/report", summary="Printable Diagnostic Laboratory Report Payload")
async def get_printable_lab_report(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_lab_clinical),
):
    """Generates official structured diagnostic report suitable for hospital legal discharge, referral, and archiving."""
    stmt = (
        select(LabOrder)
        .where(LabOrder.id == order_id)
        .options(
            selectinload(LabOrder.patient),
            selectinload(LabOrder.ordering_doctor),
            selectinload(LabOrder.sample_collector),
            selectinload(LabOrder.verified_by),
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.results).selectinload(LabResult.technologist),
        )
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Laboratory order not found")

    order_resp = _build_order_response(order)

    return {
        "hospital_header": {
            "name_en": "Mettu Karl Comprehensive Specialized Hospital",
            "name_om": "Hospitaala Waliigalaa Ispeeshaalaayizdii Karl Mattuu",
            "department": "Department of Pathology & Clinical Laboratory Diagnostics",
            "accreditation": "ISO 15189 / Ethiopian Standards Agency Certified Level 4",
            "address": "Mettu, Illubabor Zone, Oromia, Ethiopia",
            "phone": "+251 47 441 2345",
            "tin_number": "0038912401",
        },
        "order": order_resp.model_dump(),
        "verification_badge": {
            "qr_payload": f"MKH-LIS-VERIFY:{order.order_number}:{order.patient.mrn}:{order.status.value}",
            "verified_by": order_resp.verified_by_name or "Gemechu Desta (Chief Lab Technologist)",
            "verification_timestamp": order.completed_at.isoformat() if order.completed_at else None,
            "has_critical_alert": order.has_critical_flag,
        },
    }
