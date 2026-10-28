"""
Patient business logic service handling persistence and FHIR R4 interoperability.
"""
from datetime import datetime, timezone
from typing import List, Optional, Tuple
import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Gender, Patient
from app.schemas.fhir import FHIRPatientBundle, FHIRPatientResource, patient_to_fhir_dict
from app.schemas.patient import PatientCreate, PatientUpdate


def generate_mrn() -> str:
    """Generate a unique Hospital Medical Record Number (MRN)."""
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"MKH-{datetime.now(timezone.utc).year}-{unique_suffix}"


async def get_patient_by_id(db: AsyncSession, patient_id: int) -> Optional[Patient]:
    """Fetch patient by internal database ID."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    return result.scalar_one_or_none()


async def get_patient_by_mrn(db: AsyncSession, mrn: str) -> Optional[Patient]:
    """Fetch patient by hospital MRN."""
    result = await db.execute(select(Patient).where(Patient.mrn == mrn))
    return result.scalar_one_or_none()


async def get_patient_by_fhir_id(db: AsyncSession, fhir_id: str) -> Optional[Patient]:
    """Fetch patient by FHIR resource ID."""
    result = await db.execute(select(Patient).where(Patient.fhir_id == fhir_id))
    return result.scalar_one_or_none()


async def list_patients(
    db: AsyncSession,
    *,
    search: Optional[str] = None,
    gender: Optional[Gender] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[Patient], int]:
    """List patients with optional search and pagination."""
    query = select(Patient).where(Patient.is_active.is_(True))

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Patient.first_name.ilike(search_pattern),
                Patient.last_name.ilike(search_pattern),
                Patient.mrn.ilike(search_pattern),
                Patient.phone_number.ilike(search_pattern),
            )
        )

    if gender:
        query = query.where(Patient.gender == gender)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    patients = list(result.scalars().all())

    return patients, total


async def create_patient(db: AsyncSession, patient_in: PatientCreate) -> Patient:
    """Create a new patient record with MRN and FHIR identifiers."""
    mrn = patient_in.mrn if patient_in.mrn else generate_mrn()
    fhir_id = str(uuid.uuid4())

    patient = Patient(
        mrn=mrn,
        fhir_id=fhir_id,
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        birth_date=patient_in.birth_date,
        gender=patient_in.gender,
        phone_number=patient_in.phone_number,
        email=patient_in.email,
        address_line=patient_in.address_line,
        city=patient_in.city,
        state_province=patient_in.state_province,
        postal_code=patient_in.postal_code,
        is_active=True,
    )

    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


async def update_patient(
    db: AsyncSession,
    patient: Patient,
    patient_in: PatientUpdate,
) -> Patient:
    """Update existing patient details."""
    update_data = patient_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    patient.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(patient)
    return patient


def to_fhir_bundle(patients: List[Patient], base_url: str, total: int) -> FHIRPatientBundle:
    """Pack a list of Patient records into a FHIR R4 Bundle."""
    entries = []
    for p in patients:
        resource_dict = patient_to_fhir_dict(p)
        entries.append(
            {
                "fullUrl": f"{base_url}/Patient/{p.fhir_id}",
                "resource": resource_dict,
            }
        )

    return FHIRPatientBundle(
        total=total,
        entry=entries,  # type: ignore[arg-type]
    )
