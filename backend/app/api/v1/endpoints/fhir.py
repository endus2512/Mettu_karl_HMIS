"""
FHIR R4 Patient Resource endpoints.
Implements HL7 FHIR Release 4 standard specifications for Patient resources.
"""
from typing import Annotated, Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_user
from app.core.audit import record_audit_event
from app.core.config import settings
from app.core.database import get_db
from app.models.patient import Gender
from app.models.user import User, UserRole
from app.schemas.fhir import (
    FHIRHumanName,
    FHIRPatientBundle,
    FHIRPatientResource,
    patient_to_fhir_dict,
)
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.services.patient_service import (
    create_patient,
    get_patient_by_fhir_id,
    get_patient_by_id,
    get_patient_by_mrn,
    list_patients,
    to_fhir_bundle,
    update_patient,
)

router = APIRouter()


@router.get("/Patient", response_model=FHIRPatientBundle, summary="FHIR R4 Patient Search")
async def search_fhir_patients(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    name: Optional[str] = Query(None, description="Search by patient name or MRN"),
    gender: Optional[Gender] = Query(None, description="Filter by gender (male, female, other, unknown)"),
    _count: int = Query(50, ge=1, le=100, description="Page size"),
    _offset: int = Query(0, ge=0, description="Pagination offset"),
) -> FHIRPatientBundle:
    """
    FHIR R4 Patient searchset bundle endpoint.
    Returns compliant FHIR Bundle containing matching Patient resources.
    """
    patients, total = await list_patients(
        db,
        search=name,
        gender=gender,
        skip=_offset,
        limit=_count,
    )

    await record_audit_event(
        db,
        user_id=current_user.id,
        action="FHIR_PATIENT_SEARCH",
        resource="Patient",
        ip_address=get_client_ip(request),
        result="success",
        detail={"query": name, "count": len(patients)},
    )

    bundle = to_fhir_bundle(
        patients=patients,
        base_url=settings.FHIR_SERVER_BASE_URL,
        total=total,
    )

    # Privacy Protection: If administrator, mask patient identifiers (Executive BI overview only)
    if current_user.role == UserRole.ADMIN:
        for entry in bundle.entry:
            entry.resource.name = [
                FHIRHumanName(use="anonymous", family="[PROTECTED]", given=["CONFIDENTIAL"])
            ]
            entry.resource.telecom = []

    return bundle


@router.get("/Patient/{fhir_id}", summary="FHIR R4 Read Patient by ID")
async def get_fhir_patient_by_id(
    fhir_id: str,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Dict[str, Any]:
    """Retrieve an individual Patient by FHIR UUID in FHIR R4 JSON format."""
    patient = await get_patient_by_fhir_id(db, fhir_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with FHIR ID '{fhir_id}' not found",
        )

    await record_audit_event(
        db,
        user_id=current_user.id,
        action="FHIR_PATIENT_READ",
        resource="Patient",
        resource_id=fhir_id,
        ip_address=get_client_ip(request),
        result="success",
    )

    patient_dict = patient_to_fhir_dict(patient)
    if current_user.role == UserRole.ADMIN:
        # Privacy Masking: Administrative role only sees high-level metadata, clinical details masked
        patient_dict["name"] = [{"use": "anonymous", "family": "[PROTECTED]", "given": ["CONFIDENTIAL"]}]
        patient_dict["telecom"] = []
        patient_dict["_confidentiality"] = "Clinical record masked for administrative staff. Access restricted to clinical practitioners."
    return patient_dict


@router.post("/Patient", status_code=status.HTTP_201_CREATED, summary="FHIR R4 Create Patient")
async def create_fhir_patient(
    patient_in: PatientCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Dict[str, Any]:
    """Create a new Patient and return the created FHIR R4 Patient resource."""
    # RBAC Guard: Clinical write restricted to clinical/reception staff
    if current_user.role not in (UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied (Eeyyama hin qabdan). Only clinical and front-desk staff can create patient medical records.",
        )

    patient = await create_patient(db, patient_in)

    await record_audit_event(
        db,
        user_id=current_user.id,
        action="FHIR_PATIENT_CREATE",
        resource="Patient",
        resource_id=patient.fhir_id,
        ip_address=get_client_ip(request),
        result="success",
        detail={"mrn": patient.mrn},
    )

    return patient_to_fhir_dict(patient)


@router.put("/Patient/{fhir_id}", summary="FHIR R4 Update Patient")
async def update_fhir_patient(
    fhir_id: str,
    patient_update: PatientUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Dict[str, Any]:
    """Update patient demographics by FHIR ID."""
    # RBAC Guard: Clinical write restricted to clinical/reception staff
    if current_user.role not in (UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied (Eeyyama hin qabdan). Only clinical practitioners can update patient medical charts.",
        )

    patient = await get_patient_by_fhir_id(db, fhir_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with FHIR ID '{fhir_id}' not found",
        )

    updated_patient = await update_patient(db, patient, patient_update)

    await record_audit_event(
        db,
        user_id=current_user.id,
        action="FHIR_PATIENT_UPDATE",
        resource="Patient",
        resource_id=fhir_id,
        ip_address=get_client_ip(request),
        result="success",
    )

    return patient_to_fhir_dict(updated_patient)
