"""
National Digital ID (Fayda / FIN) eKYC & Patient Linkage Endpoints.
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.fayda import FaydaRecord
from app.models.user import User
from app.schemas.fayda import (
    FaydaLookupRequest,
    FaydaRecordCreate,
    FaydaRecordResponse,
    FaydaVerificationResponse,
)
from app.services.fayda_service import link_fayda_to_patient, verify_fayda_identity

router = APIRouter()


@router.post("/verify", response_model=FaydaVerificationResponse, summary="Verify Fayda National Digital ID")
async def verify_fayda(
    lookup: FaydaLookupRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> FaydaVerificationResponse:
    """eKYC query against Ethiopian National ID Program (NIDP) Fayda gateway."""
    return await verify_fayda_identity(lookup.fin_number)


@router.post("/link", response_model=FaydaRecordResponse, status_code=status.HTTP_201_CREATED, summary="Link Fayda to Patient")
async def link_fayda(
    link_in: FaydaRecordCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FaydaRecord:
    """Link verified Fayda record to patient master demographic registry."""
    return await link_fayda_to_patient(db=db, link_in=link_in)


@router.get("/patient/{patient_id}", response_model=Optional[FaydaRecordResponse], summary="Get Patient's Linked Fayda")
async def get_patient_fayda(
    patient_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Optional[FaydaRecord]:
    """Retrieve verified National Digital ID linked to patient."""
    res = await db.execute(select(FaydaRecord).where(FaydaRecord.patient_id == patient_id))
    return res.scalar_one_or_none()
