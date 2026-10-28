"""
CBHI & EHIA Insurance Claims and Adjudication service.
Processes individual encounter claims, batch submission, and reimbursement auditing.
"""
from datetime import datetime, timezone
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.insurance_claims import (
    ClaimStatus,
    InsuranceClaimBatch,
    PatientInsuranceClaim,
)
from app.schemas.insurance_claims import ClaimAdjudicationRequest, PatientInsuranceClaimCreate


async def create_insurance_claim(
    db: AsyncSession,
    claim_in: PatientInsuranceClaimCreate,
) -> PatientInsuranceClaim:
    """Submit clinical encounter claim for CBHI/EHIA insurance reimbursement."""
    claim_num = f"CLM-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:6].upper()}"
    claim = PatientInsuranceClaim(
        claim_number=claim_num,
        **claim_in.model_dump(),
        status=ClaimStatus.SUBMITTED,
        created_at=datetime.now(timezone.utc),
    )
    db.add(claim)
    await db.commit()
    await db.refresh(claim)

    if claim.batch_id:
        await recalculate_batch_totals(db, claim.batch_id)

    return claim


async def adjudicate_insurance_claim(
    db: AsyncSession,
    claim_id: int,
    adjudication: ClaimAdjudicationRequest,
) -> PatientInsuranceClaim:
    """Adjudicate insurance claim (Approved / Rejected) by insurance auditor."""
    res = await db.execute(select(PatientInsuranceClaim).where(PatientInsuranceClaim.id == claim_id))
    claim = res.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

    claim.status = adjudication.status
    claim.approved_amount_etb = adjudication.approved_amount_etb
    claim.rejection_reason = adjudication.rejection_reason

    await db.commit()
    await db.refresh(claim)

    if claim.batch_id:
        await recalculate_batch_totals(db, claim.batch_id)

    return claim


async def recalculate_batch_totals(
    db: AsyncSession,
    batch_id: int,
) -> None:
    """Update aggregate totals on batch header."""
    res = await db.execute(select(InsuranceClaimBatch).where(InsuranceClaimBatch.id == batch_id))
    batch = res.scalar_one_or_none()
    if not batch:
        return

    # Total claimed
    agg = await db.execute(
        select(
            func.count(PatientInsuranceClaim.id),
            func.coalesce(func.sum(PatientInsuranceClaim.claimed_amount_etb), 0.0),
            func.coalesce(func.sum(PatientInsuranceClaim.approved_amount_etb), 0.0),
        ).where(PatientInsuranceClaim.batch_id == batch_id)
    )
    count, total_amt, approved_amt = agg.one()
    batch.total_claims_count = count
    batch.total_amount_etb = total_amt
    batch.approved_amount_etb = approved_amt
    await db.commit()
