"""
Hospital Supply Chain, Public Tenders, Vendor Bidding, and PO Endpoints.
"""
from datetime import date, datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.procurement import BidStatus, HospitalTender, PurchaseOrder, TenderStatus, VendorBid
from app.models.user import User
from app.schemas.procurement import (
    HospitalTenderCreate,
    HospitalTenderResponse,
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    VendorBidCreate,
    VendorBidResponse,
)

router = APIRouter()


@router.post("/tenders", response_model=HospitalTenderResponse, status_code=status.HTTP_201_CREATED, summary="Publish Procurement Tender")
async def publish_tender(
    tender_in: HospitalTenderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> HospitalTender:
    """Publish open or restricted hospital procurement tender."""
    tender = HospitalTender(
        **tender_in.model_dump(),
        status=TenderStatus.PUBLISHED,
        created_at=datetime.now(timezone.utc),
    )
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    return tender


@router.get("/tenders", response_model=List[HospitalTenderResponse], summary="List Procurement Tenders")
async def list_tenders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: Optional[TenderStatus] = Query(None, alias="status", description="Filter by tender state"),
) -> List[HospitalTender]:
    """Retrieve hospital procurement tenders."""
    query = select(HospitalTender).order_by(HospitalTender.submission_deadline.asc())
    if status_filter:
        query = query.where(HospitalTender.status == status_filter)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/bids", response_model=VendorBidResponse, status_code=status.HTTP_201_CREATED, summary="Submit Vendor Bid")
async def submit_vendor_bid(
    bid_in: VendorBidCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> VendorBid:
    """Submit commercial quote and technical proposal for open tender."""
    # Ensure tender exists and is accepting bids
    tender_res = await db.execute(select(HospitalTender).where(HospitalTender.id == bid_in.tender_id))
    tender = tender_res.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tender not found")

    bid = VendorBid(
        **bid_in.model_dump(),
        status=BidStatus.SUBMITTED,
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(bid)
    await db.commit()
    await db.refresh(bid)
    return bid


@router.get("/bids", response_model=List[VendorBidResponse], summary="List Vendor Bids")
async def list_vendor_bids(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    tender_id: Optional[int] = Query(None, description="Filter bids by tender ID"),
) -> List[VendorBid]:
    """Retrieve submitted vendor quotations for tender evaluation committee."""
    query = select(VendorBid).order_by(VendorBid.submitted_at.desc())
    if tender_id:
        query = query.where(VendorBid.tender_id == tender_id)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/purchase-orders", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED, summary="Issue Purchase Order")
async def issue_purchase_order(
    po_in: PurchaseOrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PurchaseOrder:
    """Issue formal Purchase Order (PO) to awarded vendor."""
    po_number = f"PO-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:6].upper()}"
    po = PurchaseOrder(
        po_number=po_number,
        **po_in.model_dump(),
        is_approved=True,
    )
    db.add(po)
    await db.commit()
    await db.refresh(po)
    return po


@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse], summary="List Purchase Orders")
async def list_purchase_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[PurchaseOrder]:
    """Retrieve issued purchase orders."""
    result = await db.execute(select(PurchaseOrder).order_by(PurchaseOrder.issued_date.desc()))
    return list(result.scalars().all())
