"""
Clinical Decision Support System (CDSS) safety evaluation endpoints.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.cdss import (
    CDSSCheckResult,
    CheckPrescriptionRequest,
)
from app.services.cdss_service import evaluate_prescription_safety

router = APIRouter()

cdss_guard = require_roles(UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.SUPER_ADMIN)


@router.post("/check-prescription", response_model=CDSSCheckResult, summary="Check Prescription Safety (DDI & Allergies)")
async def check_prescription_safety(
    check_req: CheckPrescriptionRequest,
    current_user: Annotated[User, Depends(cdss_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CDSSCheckResult:
    """
    Evaluate candidate medication list against:
    - Known Drug-Drug Interactions (DDI)
    - Patient allergy history
    Returns immediate clinical warnings before final order sign-off.
    """
    return await evaluate_prescription_safety(
        db,
        patient_id=check_req.patient_id,
        drug_names=check_req.drug_names,
    )
