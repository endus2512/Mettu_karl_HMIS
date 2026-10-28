"""
CBHI & EHIA Insurance Claims and Adjudication Endpoints.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.insurance_claims import (
    ClaimStatus,
    InsuranceClaimBatch,
    PatientInsuranceClaim,
)
from app.models.user import User, UserRole
from app.schemas.insurance_claims import (
    ClaimAdjudicationRequest,
    InsuranceClaimBatchCreate,
    InsuranceClaimBatchResponse,
    PatientInsuranceClaimCreate,
    PatientInsuranceClaimResponse,
)
from app.services.claims_service import adjudicate_insurance_claim, create_insurance_claim

router = APIRouter()

insurance_guard = require_roles(UserRole.INSURANCE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN)


@router.post("/batches", response_model=InsuranceClaimBatchResponse, status_code=status.HTTP_201_CREATED, summary="Create Insurance Batch")
async def create_claim_batch(
    batch_in: InsuranceClaimBatchCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(insurance_guard)],
) -> InsuranceClaimBatch:
    """Create monthly or period electronic insurance claim batch header."""
    batch = InsuranceClaimBatch(
        **batch_in.model_dump(),
        status=ClaimStatus.DRAFT,
    )
    db.add(batch)
    await db.commit()
    await db.refresh(batch)
    return batch


@router.get("/batches", response_model=List[InsuranceClaimBatchResponse], summary="List Insurance Claim Batches")
async def list_claim_batches(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(insurance_guard)],
) -> List[InsuranceClaimBatch]:
    """Retrieve compiled CBHI and EHIA claim batches."""
    res = await db.execute(select(InsuranceClaimBatch).order_by(InsuranceClaimBatch.id.desc()))
    return list(res.scalars().all())


@router.post("/claims", response_model=PatientInsuranceClaimResponse, status_code=status.HTTP_201_CREATED, summary="Submit Insurance Claim")
async def submit_claim(
    claim_in: PatientInsuranceClaimCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PatientInsuranceClaim:
    """Submit clinical encounter claim item for insurance reimbursement."""
    return await create_insurance_claim(db=db, claim_in=claim_in)


@router.get("/claims", response_model=List[PatientInsuranceClaimResponse], summary="List Insurance Claims")
async def list_claims(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(insurance_guard)],
    batch_id: Optional[int] = Query(None, description="Filter claims by batch ID"),
    claim_status: Optional[ClaimStatus] = Query(None, alias="status", description="Filter by adjudication status"),
) -> List[PatientInsuranceClaim]:
    """Retrieve submitted insurance claim line items."""
    query = select(PatientInsuranceClaim).order_by(PatientInsuranceClaim.created_at.desc())
    if batch_id:
        query = query.where(PatientInsuranceClaim.batch_id == batch_id)
    if claim_status:
        query = query.where(PatientInsuranceClaim.status == claim_status)
    res = await db.execute(query)
    return list(res.scalars().all())


@router.post("/claims/{claim_id}/adjudicate", response_model=PatientInsuranceClaimResponse, summary="Adjudicate Insurance Claim")
async def adjudicate_claim(
    claim_id: int,
    adjudication: ClaimAdjudicationRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(insurance_guard)],
) -> PatientInsuranceClaim:
    """Adjudicate claim as Approved or Rejected with audit notes."""
    return await adjudicate_insurance_claim(db=db, claim_id=claim_id, adjudication=adjudication)
