"""
Mortuary Management, Cold Vaults, and Autopsy endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.mortuary import BodyVault, MortuaryRecord, VaultStatus
from app.models.user import User
from app.schemas.mortuary import (
    BodyVaultResponse,
    MortuaryRecordCreate,
    MortuaryRecordResponse,
    ReleaseDeceasedRequest,
)

router = APIRouter()


@router.get("/vaults", response_model=List[BodyVaultResponse], summary="List Cold Vault Compartments")
async def list_vaults(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[BodyVault]:
    """Retrieve mortuary preservation vaults and occupancy status."""
    res = await db.execute(select(BodyVault).order_by(BodyVault.vault_code.asc()))
    return list(res.scalars().all())


@router.post("/records", response_model=MortuaryRecordResponse, status_code=status.HTTP_201_CREATED, summary="Admit Deceased to Mortuary")
async def admit_deceased(
    record_in: MortuaryRecordCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MortuaryRecord:
    """Record deceased admission into mortuary preservation with assigned vault."""
    tag = f"MORT-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:6].upper()}"

    record = MortuaryRecord(
        tag_number=tag,
        patient_id=record_in.patient_id,
        deceased_name=record_in.deceased_name,
        gender=record_in.gender,
        datetime_of_death=record_in.datetime_of_death,
        cause_of_death=record_in.cause_of_death,
        declaring_doctor_name=record_in.declaring_doctor_name,
        body_vault_id=record_in.body_vault_id,
        death_certificate_number=record_in.death_certificate_number,
        is_autopsy_conducted=record_in.is_autopsy_conducted,
    )
    db.add(record)

    # Mark vault as occupied
    if record_in.body_vault_id:
        v_stmt = select(BodyVault).where(BodyVault.id == record_in.body_vault_id)
        v_res = await db.execute(v_stmt)
        vault = v_res.scalar_one_or_none()
        if vault:
            vault.status = VaultStatus.OCCUPIED

    await db.commit()
    await db.refresh(record)
    return record


@router.post("/records/{record_id}/release", response_model=MortuaryRecordResponse, summary="Release Deceased to Family / Next of Kin")
async def release_deceased(
    record_id: int,
    release_in: ReleaseDeceasedRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MortuaryRecord:
    """Release deceased body to family with legal death certificate validation."""
    stmt = select(MortuaryRecord).where(MortuaryRecord.id == record_id)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mortuary record not found")

    record.released_at = datetime.now(timezone.utc)
    record.released_to_name = release_in.released_to_name
    record.released_to_relationship = release_in.released_to_relationship
    record.death_certificate_number = release_in.death_certificate_number

    # Free up the vault compartment
    if record.body_vault_id:
        v_stmt = select(BodyVault).where(BodyVault.id == record.body_vault_id)
        v_res = await db.execute(v_stmt)
        vault = v_res.scalar_one_or_none()
        if vault:
            vault.status = VaultStatus.VACANT

    await db.commit()
    await db.refresh(record)
    return record
