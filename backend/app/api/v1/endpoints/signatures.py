"""
Clinical Digital Signature Endpoints.
Complies with Ethiopian Electronic Signature Proclamation No. 1072/2018.
Provides tamper-evident cryptographic sealing for hospital prescriptions, discharge summaries,
operative reports, and mortuary death certificates.
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.signature import ClinicalDigitalSignature
from app.models.user import User, UserRole
from app.schemas.signature import (
    ClinicalSignatureCreate,
    ClinicalSignatureResponse,
    ClinicalSignatureVerifyRequest,
    VerificationAuditResult,
)
from app.services.digital_signature_service import (
    sign_clinical_document,
    verify_clinical_document,
)

router = APIRouter()

# Authorize clinicians capable of legally signing records
signing_guard = require_roles(
    UserRole.DOCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.PHARMACIST,
    UserRole.NURSE,
)


@router.post("/sign", response_model=ClinicalSignatureResponse, status_code=status.HTTP_201_CREATED)
async def sign_document_endpoint(
    req: ClinicalSignatureCreate,
    current_user: Annotated[User, Depends(signing_guard)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Cryptographically seal a clinical document with the authenticated clinician's credentials.
    """
    sig = await sign_clinical_document(
        db=db,
        user=current_user,
        document_type=req.document_type,
        document_id=req.document_id,
        payload=req.document_payload,
        license_no=req.clinician_license_number,
    )
    return ClinicalSignatureResponse.model_validate(sig)


@router.post("/verify", response_model=VerificationAuditResult)
async def verify_document_endpoint(
    req: ClinicalSignatureVerifyRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Verify tamper-evident integrity of a medical document against its cryptographic seal.
    Detects any unauthorized post-signature alteration of prescriptions or summaries.
    """
    is_authentic, tamper_detected, sig, msg = await verify_clinical_document(
        db=db,
        document_type=req.document_type,
        document_id=req.document_id,
        verification_seal=req.verification_seal,
        current_payload=req.document_payload,
    )

    if not sig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signature record or verification seal not found",
        )

    return VerificationAuditResult(
        document_id=sig.document_id,
        document_type=sig.document_type,
        verification_seal=sig.verification_seal,
        signer_full_name=sig.signer_full_name,
        signer_license=sig.clinician_license_number,
        is_authentic=is_authentic,
        tamper_detected=tamper_detected,
        signed_timestamp=sig.signed_at,
        verification_message=msg,
    )


@router.get("/document/{document_type}/{document_id}", response_model=Optional[ClinicalSignatureResponse])
async def get_document_signature(
    document_type: str,
    document_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(signing_guard)],
):
    """Fetch the active cryptographic signature seal for a document."""
    stmt = select(ClinicalDigitalSignature).where(
        ClinicalDigitalSignature.document_type == document_type,
        ClinicalDigitalSignature.document_id == document_id,
        ClinicalDigitalSignature.is_revoked.is_(False),
    )
    sig = (await db.execute(stmt)).scalar_one_or_none()
    if not sig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active signature found for document")
    return ClinicalSignatureResponse.model_validate(sig)
