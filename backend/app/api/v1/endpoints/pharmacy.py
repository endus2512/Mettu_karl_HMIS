"""
Pharmacy, Drug Formulary, Inventory Batches, and Prescription endpoints.
"""
from datetime import date, datetime, timedelta, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_user, require_roles_flexible
from app.core.audit import record_audit_event
from app.core.database import get_db
from app.models.patient import Patient
from app.models.pharmacy import (
    Drug,
    DrugBatch,
    MovementType,
    Prescription,
    PrescriptionItem,
    PrescriptionStatus,
    StockMovement,
)
from app.models.user import User, UserRole
from app.schemas.pharmacy import (
    BatchDetail,
    DispenseItemResult,
    DispenseResultResponse,
    DispensedBatchUsage,
    DrugBatchCreate,
    DrugBatchResponse,
    DrugCreate,
    DrugInventoryItemResponse,
    DrugResponse,
    PatientBrief,
    PrescriberBrief,
    PrescriptionCreate,
    PrescriptionDetailResponse,
    PrescriptionItemDetail,
    PrescriptionResponse,
    StockAlert,
    StockMovementResponse,
)
from app.services.pharmacy_service import (
    check_inventory_alerts,
    dispense_prescription_item,
    get_fefo_batches_for_drug,
)

pharmacist_guard = require_roles_flexible(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN)
doctor_guard = require_roles_flexible(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)

router = APIRouter()


@router.get("/drugs", response_model=List[DrugResponse], summary="List Drugs in Formulary")
async def list_drugs(
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Optional[str] = Query(None, description="Search by name or generic name"),
) -> List[Drug]:
    """Retrieve drug catalog with optional filtering."""
    query = select(Drug).where(Drug.is_active.is_(True))
    if search:
        query = query.where(Drug.name.ilike(f"%{search}%") | Drug.generic_name.ilike(f"%{search}%"))
    res = await db.execute(query)
    return list(res.scalars().all())


@router.get("/inventory", response_model=List[DrugInventoryItemResponse], summary="Real-time FEFO Pharmacy Inventory")
async def get_inventory(
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Optional[str] = Query(None, description="Search by medication or generic name"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: low, expiring, good, out_of_stock"),
) -> List[DrugInventoryItemResponse]:
    """
    Retrieve real-time inventory aggregated across batches.
    Batches are ordered by Earliest Expiry Date (FEFO).
    """
    today = date.today()
    ninety_days = today + timedelta(days=90)

    query = select(Drug).where(Drug.is_active.is_(True))
    if search:
        query = query.where(Drug.name.ilike(f"%{search}%") | Drug.generic_name.ilike(f"%{search}%"))
    query = query.order_by(Drug.name.asc())

    res = await db.execute(query)
    drugs = list(res.scalars().all())

    inventory_items: List[DrugInventoryItemResponse] = []

    for drug in drugs:
        b_query = select(DrugBatch).where(DrugBatch.drug_id == drug.id).order_by(DrugBatch.expiry_date.asc())
        b_res = await db.execute(b_query)
        all_batches = list(b_res.scalars().all())

        batch_details: List[BatchDetail] = []
        total_qty = 0
        earliest_exp: Optional[date] = None

        for b in all_batches:
            days_left = (b.expiry_date - today).days
            if b.current_quantity <= 0:
                b_status = "depleted"
            elif b.expiry_date < today:
                b_status = "expired"
            elif b.expiry_date <= ninety_days:
                b_status = "expiring_soon"
                total_qty += b.current_quantity
            else:
                b_status = "good"
                total_qty += b.current_quantity

            if b.current_quantity > 0 and b.expiry_date >= today:
                if earliest_exp is None or b.expiry_date < earliest_exp:
                    earliest_exp = b.expiry_date

            batch_details.append(
                BatchDetail(
                    id=b.id,
                    batch_number=b.batch_number,
                    manufacture_date=b.manufacture_date,
                    expiry_date=b.expiry_date,
                    initial_quantity=b.initial_quantity,
                    current_quantity=b.current_quantity,
                    cost_price=b.cost_price,
                    days_to_expiry=days_left,
                    status=b_status,
                )
            )

        if total_qty == 0:
            drug_status = "out_of_stock"
        elif total_qty <= drug.reorder_level:
            drug_status = "low"
        elif any(b.status == "expiring_soon" for b in batch_details if b.current_quantity > 0):
            drug_status = "expiring"
        else:
            drug_status = "good"

        if status_filter and status_filter != "all":
            if status_filter != drug_status:
                continue

        inventory_items.append(
            DrugInventoryItemResponse(
                id=drug.id,
                name=drug.name,
                generic_name=drug.generic_name,
                dosage_form=drug.dosage_form,
                strength=drug.strength,
                unit_price=drug.unit_price,
                reorder_level=drug.reorder_level,
                is_active=drug.is_active,
                total_quantity=total_qty,
                status=drug_status,
                earliest_expiry=earliest_exp,
                batches=batch_details,
            )
        )

    return inventory_items


@router.post("/drugs", response_model=DrugResponse, status_code=status.HTTP_201_CREATED, summary="Add Drug to Formulary")
async def create_drug(
    drug_in: DrugCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(pharmacist_guard)],
) -> Drug:
    """Add a new pharmaceutical product."""
    drug = Drug(**drug_in.model_dump())
    db.add(drug)
    await db.commit()
    await db.refresh(drug)
    return drug


@router.post("/batches", response_model=DrugBatchResponse, status_code=status.HTTP_201_CREATED, summary="Receive Drug Batch")
async def add_batch(
    batch_in: DrugBatchCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(pharmacist_guard)],
) -> DrugBatch:
    """Receive and record a new batch with expiry date into pharmacy stock."""
    # Verify drug exists
    drug_stmt = select(Drug).where(Drug.id == batch_in.drug_id)
    drug = (await db.execute(drug_stmt)).scalar_one_or_none()
    if not drug:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified medication does not exist")

    batch = DrugBatch(
        drug_id=batch_in.drug_id,
        batch_number=batch_in.batch_number,
        manufacture_date=batch_in.manufacture_date,
        expiry_date=batch_in.expiry_date,
        initial_quantity=batch_in.initial_quantity,
        current_quantity=batch_in.initial_quantity,
        cost_price=batch_in.cost_price,
    )
    db.add(batch)
    await db.flush()

    # Log stock intake movement
    movement = StockMovement(
        drug_id=batch.drug_id,
        batch_id=batch.id,
        movement_type=MovementType.RECEIVE,
        quantity=batch.initial_quantity,
        balance_after=batch.initial_quantity,
        reference_number=f"BATCH-RCV-{batch.batch_number}",
        user_id=current_user.id,
    )
    db.add(movement)
    await db.commit()
    await db.refresh(batch)
    return batch


@router.get("/alerts", response_model=List[StockAlert], summary="Get Inventory & Expiry Alerts")
async def get_alerts(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> List[StockAlert]:
    """Scan inventory and return real-time FEFO/Expiry and Low Stock alerts."""
    return await check_inventory_alerts(db)


@router.get("/prescriptions", response_model=List[PrescriptionDetailResponse], summary="List Prescriptions with Patient & Prescriber Details")
async def list_prescriptions(
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Optional[str] = Query(None, description="Filter by status (pending, dispensed, partially_dispensed, cancelled)"),
    search: Optional[str] = Query(None, description="Search by patient MRN or prescription code"),
) -> List[PrescriptionDetailResponse]:
    """List clinical prescriptions for pharmacy dispensing queue."""
    query = select(Prescription).order_by(Prescription.created_at.desc())
    if status and status != "all":
        query = query.where(Prescription.status == status)

    res = await db.execute(query)
    prescriptions = list(res.scalars().all())

    results: List[PrescriptionDetailResponse] = []
    for rx in prescriptions:
        # Load Patient
        pat_stmt = select(Patient).where(Patient.id == rx.patient_id)
        pat = (await db.execute(pat_stmt)).scalar_one_or_none()
        patient_brief = None
        if pat:
            patient_brief = PatientBrief(
                id=pat.id,
                mrn=pat.mrn,
                first_name=pat.first_name,
                last_name=pat.last_name,
                gender=pat.gender.value if hasattr(pat.gender, "value") else str(pat.gender),
                birth_date=pat.birth_date,
                phone_number=pat.phone_number,
            )

        # Load Prescriber
        presc_stmt = select(User).where(User.id == rx.prescriber_id)
        presc = (await db.execute(presc_stmt)).scalar_one_or_none()
        prescriber_brief = None
        if presc:
            prescriber_brief = PrescriberBrief(
                id=presc.id,
                username=presc.username,
                full_name=presc.full_name,
                role=presc.role.value if hasattr(presc.role, "value") else str(presc.role),
            )

        # Load Items with Drug and Batch info
        items_stmt = select(PrescriptionItem).where(PrescriptionItem.prescription_id == rx.id)
        items = list((await db.execute(items_stmt)).scalars().all())

        item_details: List[PrescriptionItemDetail] = []
        rx_total = 0.0

        for it in items:
            d_stmt = select(Drug).where(Drug.id == it.drug_id)
            d = (await db.execute(d_stmt)).scalar_one_or_none()

            b_number = None
            if it.batch_id:
                b_stmt = select(DrugBatch).where(DrugBatch.id == it.batch_id)
                b = (await db.execute(b_stmt)).scalar_one_or_none()
                if b:
                    b_number = b.batch_number

            unit_price = d.unit_price if d else 0.0
            total_item_price = unit_price * it.quantity_prescribed
            rx_total += total_item_price

            item_details.append(
                PrescriptionItemDetail(
                    id=it.id,
                    drug_id=it.drug_id,
                    drug_name=d.name if d else f"Drug #{it.drug_id}",
                    generic_name=d.generic_name if d else None,
                    dosage_form=d.dosage_form.value if d and hasattr(d.dosage_form, "value") else None,
                    strength=d.strength if d else None,
                    unit_price=unit_price,
                    total_price=total_item_price,
                    dosage=it.dosage,
                    frequency=it.frequency,
                    duration_days=it.duration_days,
                    quantity_prescribed=it.quantity_prescribed,
                    quantity_dispensed=it.quantity_dispensed,
                    instructions=it.instructions,
                    batch_id=it.batch_id,
                    batch_number=b_number,
                    is_fully_dispensed=it.quantity_dispensed >= it.quantity_prescribed,
                )
            )

        if search:
            s = search.lower()
            mrn_match = pat and (s in pat.mrn.lower() or s in pat.first_name.lower() or s in pat.last_name.lower())
            code_match = s in rx.prescription_code.lower()
            if not (mrn_match or code_match):
                continue

        results.append(
            PrescriptionDetailResponse(
                id=rx.id,
                prescription_code=rx.prescription_code,
                patient_id=rx.patient_id,
                patient=patient_brief,
                prescriber_id=rx.prescriber_id,
                prescriber=prescriber_brief,
                status=rx.status,
                clinical_notes=rx.clinical_notes,
                created_at=rx.created_at,
                dispensed_at=rx.dispensed_at,
                items=item_details,
                total_amount=rx_total,
            )
        )

    return results


@router.post("/prescriptions", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED, summary="Create Prescription")
async def create_prescription(
    prescription_in: PrescriptionCreate,
    request: Request,
    current_user: Annotated[User, Depends(doctor_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Prescription:
    """Doctor creates an electronic prescription order for a patient."""
    code = f"RX-{uuid.uuid4().hex[:8].upper()}"
    prescription = Prescription(
        prescription_code=code,
        patient_id=prescription_in.patient_id,
        prescriber_id=current_user.id,
        status=PrescriptionStatus.PENDING,
        clinical_notes=prescription_in.clinical_notes,
    )
    db.add(prescription)
    await db.flush()

    for item_in in prescription_in.items:
        item = PrescriptionItem(
            prescription_id=prescription.id,
            drug_id=item_in.drug_id,
            dosage=item_in.dosage,
            frequency=item_in.frequency,
            duration_days=item_in.duration_days,
            quantity_prescribed=item_in.quantity_prescribed,
            quantity_dispensed=0,
            instructions=item_in.instructions,
        )
        db.add(item)

    await db.commit()
    await db.refresh(prescription)

    await record_audit_event(
        db,
        user_id=current_user.id,
        action="PRESCRIPTION_CREATE",
        resource="Prescription",
        resource_id=prescription.prescription_code,
        ip_address=get_client_ip(request),
        result="success",
    )

    return prescription


@router.post("/prescriptions/{prescription_id}/dispense", response_model=DispenseResultResponse, summary="FEFO Dispense Prescription")
async def dispense_prescription(
    prescription_id: int,
    request: Request,
    current_user: Annotated[User, Depends(pharmacist_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DispenseResultResponse:
    """Pharmacist dispenses prescription; system auto-deducts batches by earliest expiry date (FEFO)."""
    stmt = select(Prescription).where(Prescription.id == prescription_id)
    res = await db.execute(stmt)
    prescription = res.scalar_one_or_none()

    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")

    if prescription.status == PrescriptionStatus.DISPENSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prescription is already fully dispensed")

    # Dispense all items
    items_stmt = select(PrescriptionItem).where(PrescriptionItem.prescription_id == prescription_id)
    items_res = await db.execute(items_stmt)
    items = list(items_res.scalars().all())

    dispensed_items_result: List[DispenseItemResult] = []
    all_fully_dispensed = True

    for item in items:
        qty_needed = item.quantity_prescribed - item.quantity_dispensed
        d_stmt = select(Drug).where(Drug.id == item.drug_id)
        drug = (await db.execute(d_stmt)).scalar_one_or_none()
        drug_name = drug.name if drug else f"Drug #{item.drug_id}"

        if qty_needed > 0:
            dispensed_now, batches_used = await dispense_prescription_item(db, item, qty_needed, user_id=current_user.id)
            if item.quantity_dispensed < item.quantity_prescribed:
                all_fully_dispensed = False

            dispensed_items_result.append(
                DispenseItemResult(
                    item_id=item.id,
                    drug_id=item.drug_id,
                    drug_name=drug_name,
                    quantity_prescribed=item.quantity_prescribed,
                    quantity_dispensed_now=dispensed_now,
                    total_dispensed=item.quantity_dispensed,
                    batches_used=[
                        DispensedBatchUsage(
                            batch_id=bu["batch_id"],
                            batch_number=bu["batch_number"],
                            expiry_date=bu["expiry_date"],
                            quantity_deducted=bu["quantity_deducted"],
                        )
                        for bu in batches_used
                    ],
                )
            )
        else:
            dispensed_items_result.append(
                DispenseItemResult(
                    item_id=item.id,
                    drug_id=item.drug_id,
                    drug_name=drug_name,
                    quantity_prescribed=item.quantity_prescribed,
                    quantity_dispensed_now=0,
                    total_dispensed=item.quantity_dispensed,
                    batches_used=[],
                )
            )

    now = datetime.now(timezone.utc)
    prescription.dispensed_at = now
    prescription.status = PrescriptionStatus.DISPENSED if all_fully_dispensed else PrescriptionStatus.PARTIALLY_DISPENSED
    await db.commit()
    await db.refresh(prescription)

    await record_audit_event(
        db,
        user_id=current_user.id,
        action="PRESCRIPTION_DISPENSE",
        resource="Prescription",
        resource_id=prescription.prescription_code,
        ip_address=get_client_ip(request),
        result="success",
    )

    msg = "Prescription fully dispensed via FEFO batch allocation" if all_fully_dispensed else "Prescription partially dispensed (stock limited)"

    return DispenseResultResponse(
        prescription_id=prescription.id,
        prescription_code=prescription.prescription_code,
        status=prescription.status,
        dispensed_at=now,
        message=msg,
        items=dispensed_items_result,
    )


@router.get("/stock-movements", response_model=List[StockMovementResponse], summary="Pharmacy Stock Movement Audit Trail")
async def get_stock_movements(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(50, ge=1, le=200),
) -> List[StockMovementResponse]:
    """Retrieve chronologically ordered audit logs of pharmaceutical movements."""
    stmt = (
        select(StockMovement, Drug, DrugBatch, User)
        .join(Drug, StockMovement.drug_id == Drug.id)
        .join(DrugBatch, StockMovement.batch_id == DrugBatch.id)
        .outerjoin(User, StockMovement.user_id == User.id)
        .order_by(StockMovement.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    records = []
    for mv, drug, batch, user in res.all():
        records.append(
            StockMovementResponse(
                id=mv.id,
                drug_id=mv.drug_id,
                drug_name=drug.name,
                batch_id=mv.batch_id,
                batch_number=batch.batch_number,
                movement_type=mv.movement_type,
                quantity=mv.quantity,
                balance_after=mv.balance_after,
                reference_number=mv.reference_number,
                created_at=mv.created_at,
                user_name=user.full_name if user else "System Automated",
            )
        )
    return records
