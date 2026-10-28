"""
National Digital ID (Fayda / FIN) eKYC integration service.
Verifies resident identity against national directory and links Fayda FIN to Patient MPI.
"""
from datetime import date, datetime, timezone
import hashlib
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fayda import FaydaRecord, FaydaVerificationStatus
from app.models.patient import Patient
from app.schemas.fayda import FaydaRecordCreate, FaydaVerificationResponse


async def verify_fayda_identity(fin_number: str) -> FaydaVerificationResponse:
    """Mock eKYC identity query against National ID Program (NIDP) Fayda Gateway."""
    clean_fin = fin_number.strip().upper()
    if len(clean_fin) < 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid FIN format")

    # Deterministic mock derivation for demo & test environments
    hash_val = int(hashlib.md5(clean_fin.encode()).hexdigest(), 16)
    genders = ["Male", "Female"]
    gender = genders[hash_val % 2]
    
    # Deriving demo demographic details
    first_names = ["Gudeta", "Ayantu", "Tolessa", "Chaltu", "Dawit", "Hawine"]
    last_names = ["Hailu", "Mamo", "Bekele", "Benti", "Tadesse", "Dibaba"]
    first = first_names[hash_val % len(first_names)]
    last = last_names[(hash_val // 10) % len(last_names)]

    return FaydaVerificationResponse(
        verified=True,
        fin_number=clean_fin,
        full_name_en=f"{first} {last}",
        full_name_am=f"{first} {last} (ኦሮምኛ/አማርኛ)",
        date_of_birth=date(1988, 5, 14),
        gender=gender,
        phone_number="+251911223344",
        photo_url=f"https://api.fayda.et/v1/photos/{uuid.uuid4().hex[:8]}.jpg",
        verification_timestamp=datetime.now(timezone.utc),
    )


async def link_fayda_to_patient(
    db: AsyncSession,
    link_in: FaydaRecordCreate,
) -> FaydaRecord:
    """Associate verified Fayda National ID to Hospital Patient Master record."""
    # Ensure patient exists
    p_res = await db.execute(select(Patient).where(Patient.id == link_in.patient_id))
    patient = p_res.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Check if Fayda already linked
    existing_res = await db.execute(select(FaydaRecord).where(FaydaRecord.fin_number == link_in.fin_number))
    if existing_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Fayda FIN already linked to another patient")

    record = FaydaRecord(
        **link_in.model_dump(),
        verification_status=FaydaVerificationStatus.VERIFIED,
        verified_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record
