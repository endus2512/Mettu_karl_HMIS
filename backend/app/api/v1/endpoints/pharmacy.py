"""
Pharmacy, Drug Formulary, Inventory Batches, and Prescription endpoints.
"""
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_user, require_roles
from app.core.audit import record_audit_event
from app.core.database import get_db
from app.models.pharmacy import (
    Drug,
    DrugBatch,
    Prescription,
    PrescriptionItem,
    PrescriptionStatus,
)
from app.models.user import User, UserRole

pharmacist_guard = require_roles(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN)
doctor_guard = require_roles(UserRole.DOCTOR, UserRole.SUPER_ADMIN)
from app.schemas.pharmacy import (
    DrugBatchCreate,
    DrugBatchResponse,
    DrugCreate,
    DrugResponse,
    PrescriptionCreate,
    PrescriptionResponse,
    StockAlert,
)
from app.services.pharmacy_service import (
    check_inventory_alerts,
    dispense_prescription_item,
    get_fefo_batches_for_drug,
)

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
    current_user: Annotated[User, Depends(get_current_user)],
) -> DrugBatch:
    """Receive and record a new batch with expiry date into pharmacy stock."""
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
    await db.commit()
    await db.refresh(batch)
    return batch


@router.get("/alerts", response_model=List[StockAlert], summary="Get Inventory & Expiry Alerts")
async def get_alerts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[StockAlert]:
    """Scan inventory and return real-time FEFO/Expiry and Low Stock alerts."""
    return await check_inventory_alerts(db)


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


@router.post("/prescriptions/{prescription_id}/dispense", summary="FEFO Dispense Prescription")
async def dispense_prescription(
    prescription_id: int,
    request: Request,
    current_user: Annotated[User, Depends(pharmacist_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Pharmacist dispenses prescription; system auto-deducts batches by earliest expiry date (FEFO)."""
    stmt = select(Prescription).where(Prescription.id == prescription_id)
    res = await db.execute(stmt)
    prescription = res.scalar_one_or_none()

    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")

    # Dispense all items
    items_stmt = select(PrescriptionItem).where(PrescriptionItem.prescription_id == prescription_id)
    items_res = await db.execute(items_stmt)
    items = list(items_res.scalars().all())

    for item in items:
        qty_needed = item.quantity_prescribed - item.quantity_dispensed
        if qty_needed > 0:
            await dispense_prescription_item(db, item, qty_needed, user_id=current_user.id)

    prescription.status = PrescriptionStatus.DISPENSED
    await db.commit()

    return {"message": "Prescription successfully dispensed via FEFO batch allocation", "prescription_id": prescription_id}
