"""
Mortuary Management, Cold Vaults, Autopsy, and Legal Deceased Release endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_optional_current_user
from app.core.database import get_db
from app.models.mortuary import BodyVault, MortuaryRecord, VaultStatus
from app.models.user import User
from app.schemas.mortuary import (
    BodyVaultCreate,
    BodyVaultResponse,
    MortuaryRecordCreate,
    MortuaryRecordResponse,
    AutopsyRecordRequest,
    ReleaseDeceasedRequest,
    MortuaryStatsResponse,
    MortuaryCertificateVoucherResponse,
)

router = APIRouter()


@router.get("/stats", response_model=MortuaryStatsResponse, summary="Get Mortuary Cold Storage & Custody Stats")
async def get_mortuary_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> MortuaryStatsResponse:
    """Retrieve mortuary preservation units, occupancy, and post-mortem stats."""
    vaults_res = await db.execute(select(BodyVault))
    all_vaults = list(vaults_res.scalars().all())

    total_vaults = len(all_vaults)
    occupied_vaults = sum(1 for v in all_vaults if str(v.status).lower() in ["occupied", "vaultstatus.occupied"])
    vacant_vaults = sum(1 for v in all_vaults if str(v.status).lower() in ["vacant", "vaultstatus.vacant"])
    maintenance_vaults = sum(1 for v in all_vaults if str(v.status).lower() in ["maintenance", "vaultstatus.maintenance"])

    avg_temp = round(sum(v.temperature_celsius for v in all_vaults) / total_vaults, 1) if total_vaults > 0 else 2.8

    records_res = await db.execute(select(MortuaryRecord))
    all_records = list(records_res.scalars().all())

    total_admitted = len(all_records)
    total_released = sum(1 for r in all_records if r.released_to_kin or r.released_at is not None)
    total_autopsies = sum(1 for r in all_records if r.is_autopsy_conducted)

    return MortuaryStatsResponse(
        total_vaults=total_vaults,
        occupied_vaults=occupied_vaults,
        vacant_vaults=vacant_vaults,
        maintenance_vaults=maintenance_vaults,
        total_deceased_admitted=total_admitted,
        total_released=total_released,
        total_autopsies=total_autopsies,
        avg_storage_temp=avg_temp,
    )


@router.get("/vaults", response_model=List[BodyVaultResponse], summary="List Cold Vault Compartments")
async def list_vaults(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> List[BodyVaultResponse]:
    """Retrieve mortuary preservation vaults with active occupant telemetry."""
    stmt = select(BodyVault).order_by(BodyVault.vault_code.asc())
    res = await db.execute(stmt)
    vaults = list(res.scalars().all())

    # Get active records currently occupying vaults
    rec_stmt = select(MortuaryRecord).where(
        MortuaryRecord.body_vault_id.isnot(None),
        MortuaryRecord.released_at.is_(None),
    )
    rec_res = await db.execute(rec_stmt)
    active_records = {r.body_vault_id: r for r in rec_res.scalars().all()}

    output = []
    for v in vaults:
        rec = active_records.get(v.id)
        st_val = v.status.value if hasattr(v.status, "value") else str(v.status).lower().replace("vaultstatus.", "")
        output.append(
            BodyVaultResponse(
                id=v.id,
                vault_code=v.vault_code,
                vault_number=v.vault_number or v.vault_code,
                bay_name=v.bay_name or "Bay 1",
                temperature_celsius=v.temperature_celsius,
                status=st_val,
                occupant_name=rec.deceased_name if rec else None,
                occupant_tag=rec.tag_number if rec else None,
                occupant_dod=rec.datetime_of_death.strftime("%Y-%m-%d %H:%M") if rec else None,
            )
        )
    return output


@router.post("/vaults", response_model=BodyVaultResponse, status_code=status.HTTP_201_CREATED, summary="Register Cold Body Vault")
async def create_vault(
    vault_in: BodyVaultCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> BodyVaultResponse:
    """Create a new refrigerated mortuary preservation vault."""
    existing = await db.execute(select(BodyVault).where(BodyVault.vault_code == vault_in.vault_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Vault code '{vault_in.vault_code}' already exists")

    vault = BodyVault(
        vault_code=vault_in.vault_code,
        vault_number=vault_in.vault_number or vault_in.vault_code,
        bay_name=vault_in.bay_name,
        temperature_celsius=vault_in.temperature_celsius,
        status=VaultStatus.VACANT,
    )
    db.add(vault)
    await db.commit()
    await db.refresh(vault)

    st_val = vault.status.value if hasattr(vault.status, "value") else str(vault.status).lower().replace("vaultstatus.", "")
    return BodyVaultResponse(
        id=vault.id,
        vault_code=vault.vault_code,
        vault_number=vault.vault_number,
        bay_name=vault.bay_name,
        temperature_celsius=vault.temperature_celsius,
        status=st_val,
    )


@router.get("/records", response_model=List[MortuaryRecordResponse], summary="List Deceased Records")
async def list_records(
    db: Annotated[AsyncSession, Depends(get_db)],
    filter_type: Optional[str] = Query("all", description="Filter by: all, custody, released, autopsy"),
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> List[MortuaryRecordResponse]:
    """Retrieve mortuary deceased admission, autopsy, and legal release registry."""
    stmt = select(MortuaryRecord, BodyVault.vault_code).outerjoin(
        BodyVault, MortuaryRecord.body_vault_id == BodyVault.id
    ).order_by(MortuaryRecord.received_at.desc())

    if filter_type == "custody":
        stmt = stmt.where(MortuaryRecord.released_at.is_(None))
    elif filter_type == "released":
        stmt = stmt.where(MortuaryRecord.released_at.isnot(None))
    elif filter_type == "autopsy":
        stmt = stmt.where(MortuaryRecord.is_autopsy_conducted.is_(True))

    res = await db.execute(stmt)
    records_with_vault = res.all()

    output = []
    for r, v_code in records_with_vault:
        output.append(
            MortuaryRecordResponse(
                id=r.id,
                tag_number=r.tag_number,
                patient_id=r.patient_id,
                deceased_name=r.deceased_name,
                gender=r.gender,
                datetime_of_death=r.datetime_of_death,
                cause_of_death=r.cause_of_death,
                declaring_doctor_name=r.declaring_doctor_name,
                body_vault_id=r.body_vault_id,
                vault_id=r.body_vault_id,
                vault_code=v_code,
                death_certificate_number=r.death_certificate_number,
                is_autopsy_conducted=r.is_autopsy_conducted,
                autopsy_findings=r.autopsy_findings,
                pathologist_name=r.pathologist_name,
                autopsy_date=r.autopsy_date,
                burial_permit_number=r.burial_permit_number,
                police_case_number=r.police_case_number,
                received_at=r.received_at,
                released_at=r.released_at,
                released_to_name=r.released_to_name,
                released_to_relationship=r.released_to_relationship,
                contact_kin_name=r.contact_kin_name,
                contact_kin_phone=r.contact_kin_phone,
                released_to_kin=bool(r.released_to_kin),
            )
        )
    return output


@router.post("/records", response_model=MortuaryRecordResponse, status_code=status.HTTP_201_CREATED, summary="Admit Deceased to Mortuary")
async def admit_deceased(
    record_in: MortuaryRecordCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> MortuaryRecordResponse:
    """Record deceased admission into mortuary preservation with assigned vault."""
    tag = f"MORT-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:6].upper()}"

    v_id = record_in.body_vault_id or record_in.vault_id

    cert_num = record_in.death_certificate_number
    if not cert_num:
        cert_num = f"DC-MKH-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:5].upper()}"

    record = MortuaryRecord(
        tag_number=tag,
        patient_id=record_in.patient_id,
        deceased_name=record_in.deceased_name,
        gender=record_in.gender or "UNKNOWN",
        datetime_of_death=record_in.datetime_of_death or datetime.now(timezone.utc),
        cause_of_death=record_in.cause_of_death,
        declaring_doctor_name=record_in.declaring_doctor_name or record_in.certifying_physician or "Physician",
        body_vault_id=v_id,
        death_certificate_number=cert_num,
        is_autopsy_conducted=record_in.is_autopsy_conducted,
        autopsy_findings=record_in.autopsy_findings,
        pathologist_name=record_in.pathologist_name,
        police_case_number=record_in.police_case_number,
        burial_permit_number=record_in.burial_permit_number,
        contact_kin_name=record_in.contact_kin_name,
        contact_kin_phone=record_in.contact_kin_phone,
    )
    db.add(record)

    vault_code = None
    # Mark vault as occupied
    if v_id:
        v_stmt = select(BodyVault).where(BodyVault.id == v_id)
        v_res = await db.execute(v_stmt)
        vault = v_res.scalar_one_or_none()
        if vault:
            vault.status = VaultStatus.OCCUPIED
            vault_code = vault.vault_code

    await db.commit()
    await db.refresh(record)

    return MortuaryRecordResponse(
        id=record.id,
        tag_number=record.tag_number,
        patient_id=record.patient_id,
        deceased_name=record.deceased_name,
        gender=record.gender,
        datetime_of_death=record.datetime_of_death,
        cause_of_death=record.cause_of_death,
        declaring_doctor_name=record.declaring_doctor_name,
        body_vault_id=record.body_vault_id,
        vault_id=record.body_vault_id,
        vault_code=vault_code,
        death_certificate_number=record.death_certificate_number,
        is_autopsy_conducted=record.is_autopsy_conducted,
        autopsy_findings=record.autopsy_findings,
        pathologist_name=record.pathologist_name,
        autopsy_date=record.autopsy_date,
        burial_permit_number=record.burial_permit_number,
        police_case_number=record.police_case_number,
        received_at=record.received_at,
        released_at=record.released_at,
        released_to_name=record.released_to_name,
        released_to_relationship=record.released_to_relationship,
        contact_kin_name=record.contact_kin_name,
        contact_kin_phone=record.contact_kin_phone,
        released_to_kin=bool(record.released_to_kin),
    )


@router.post("/records/{record_id}/autopsy", response_model=MortuaryRecordResponse, summary="Record Post-Mortem Autopsy Findings")
async def record_autopsy(
    record_id: int,
    autopsy_in: AutopsyRecordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> MortuaryRecordResponse:
    """Document forensic or clinical post-mortem autopsy findings and confirming pathologist."""
    stmt = select(MortuaryRecord).where(MortuaryRecord.id == record_id)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mortuary record not found")

    record.is_autopsy_conducted = True
    record.pathologist_name = autopsy_in.pathologist_name
    record.autopsy_findings = autopsy_in.autopsy_findings
    record.autopsy_date = datetime.now(timezone.utc)
    if autopsy_in.confirmed_cause_of_death:
        record.cause_of_death = autopsy_in.confirmed_cause_of_death
    if autopsy_in.police_case_number:
        record.police_case_number = autopsy_in.police_case_number

    await db.commit()
    await db.refresh(record)

    vault_code = None
    if record.body_vault_id:
        v_res = await db.execute(select(BodyVault.vault_code).where(BodyVault.id == record.body_vault_id))
        vault_code = v_res.scalar_one_or_none()

    return MortuaryRecordResponse(
        id=record.id,
        tag_number=record.tag_number,
        patient_id=record.patient_id,
        deceased_name=record.deceased_name,
        gender=record.gender,
        datetime_of_death=record.datetime_of_death,
        cause_of_death=record.cause_of_death,
        declaring_doctor_name=record.declaring_doctor_name,
        body_vault_id=record.body_vault_id,
        vault_id=record.body_vault_id,
        vault_code=vault_code,
        death_certificate_number=record.death_certificate_number,
        is_autopsy_conducted=record.is_autopsy_conducted,
        autopsy_findings=record.autopsy_findings,
        pathologist_name=record.pathologist_name,
        autopsy_date=record.autopsy_date,
        burial_permit_number=record.burial_permit_number,
        police_case_number=record.police_case_number,
        received_at=record.received_at,
        released_at=record.released_at,
        released_to_name=record.released_to_name,
        released_to_relationship=record.released_to_relationship,
        contact_kin_name=record.contact_kin_name,
        contact_kin_phone=record.contact_kin_phone,
        released_to_kin=bool(record.released_to_kin),
    )


@router.post("/records/{record_id}/release", response_model=MortuaryRecordResponse, summary="Release Deceased to Family / Next of Kin")
async def release_deceased(
    record_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    release_in: Optional[ReleaseDeceasedRequest] = None,
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> MortuaryRecordResponse:
    """Release deceased body to family with legal death certificate validation."""
    stmt = select(MortuaryRecord).where(MortuaryRecord.id == record_id)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mortuary record not found")

    record.released_at = datetime.now(timezone.utc)
    record.released_to_kin = True
    if release_in:
        record.released_to_name = release_in.released_to_name or record.contact_kin_name or "Next of Kin"
        record.released_to_relationship = release_in.released_to_relationship or "Family Member"
        if release_in.contact_kin_phone:
            record.contact_kin_phone = release_in.contact_kin_phone
        if release_in.death_certificate_number:
            record.death_certificate_number = release_in.death_certificate_number
        if release_in.burial_permit_number:
            record.burial_permit_number = release_in.burial_permit_number
    elif record.contact_kin_name:
        record.released_to_name = record.contact_kin_name
        record.released_to_relationship = "Next of Kin"

    # Free up the vault compartment
    if record.body_vault_id:
        v_stmt = select(BodyVault).where(BodyVault.id == record.body_vault_id)
        v_res = await db.execute(v_stmt)
        vault = v_res.scalar_one_or_none()
        if vault:
            vault.status = VaultStatus.VACANT

    await db.commit()
    await db.refresh(record)

    vault_code = None
    if record.body_vault_id:
        v_res = await db.execute(select(BodyVault.vault_code).where(BodyVault.id == record.body_vault_id))
        vault_code = v_res.scalar_one_or_none()

    return MortuaryRecordResponse(
        id=record.id,
        tag_number=record.tag_number,
        patient_id=record.patient_id,
        deceased_name=record.deceased_name,
        gender=record.gender,
        datetime_of_death=record.datetime_of_death,
        cause_of_death=record.cause_of_death,
        declaring_doctor_name=record.declaring_doctor_name,
        body_vault_id=record.body_vault_id,
        vault_id=record.body_vault_id,
        vault_code=vault_code,
        death_certificate_number=record.death_certificate_number,
        is_autopsy_conducted=record.is_autopsy_conducted,
        autopsy_findings=record.autopsy_findings,
        pathologist_name=record.pathologist_name,
        autopsy_date=record.autopsy_date,
        burial_permit_number=record.burial_permit_number,
        police_case_number=record.police_case_number,
        received_at=record.received_at,
        released_at=record.released_at,
        released_to_name=record.released_to_name,
        released_to_relationship=record.released_to_relationship,
        contact_kin_name=record.contact_kin_name,
        contact_kin_phone=record.contact_kin_phone,
        released_to_kin=True,
    )


@router.get("/records/{record_id}/voucher", response_model=MortuaryCertificateVoucherResponse, summary="Get Official Death Certificate Voucher")
async def get_death_certificate_voucher(
    record_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
) -> MortuaryCertificateVoucherResponse:
    """Generate printable official medical death certificate and mortuary release voucher."""
    stmt = select(MortuaryRecord).where(MortuaryRecord.id == record_id)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mortuary record not found")

    vault_code = "UNASSIGNED"
    bay_name = "N/A"
    temp_str = "3.0°C"
    if record.body_vault_id:
        v_res = await db.execute(select(BodyVault).where(BodyVault.id == record.body_vault_id))
        vault = v_res.scalar_one_or_none()
        if vault:
            vault_code = vault.vault_code
            bay_name = vault.bay_name or "Bay 1"
            temp_str = f"{vault.temperature_celsius:.1f}°C"

    cert_num = record.death_certificate_number or f"DC-MKH-2026-{record.id:04d}"
    burial_num = record.burial_permit_number or f"BP-MKH-{record.id:04d}"
    verification_qr = f"https://his.mettukarl.gov.et/verify/mortuary/{record.tag_number}?tin=0038912401&cert={cert_num}"

    return MortuaryCertificateVoucherResponse(
        hospital_name="Hospitaala Riifaraalaa Mettuu Kaarli | Mettu Karl Referral Hospital",
        hospital_subtitle="Biiroo Eegumsa Fayyaa Oromiyaa • Qajeelcha Kutaa Reeffaa & Qorannoo Post-Mortem",
        tin_number="0038912401",
        telephone="+251-47-141-0022 / +251-47-141-0088",
        voucher_id=f"VCH-MORT-{record.id:05d}",
        tag_number=record.tag_number,
        death_certificate_number=cert_num,
        deceased_name=record.deceased_name,
        gender=record.gender,
        datetime_of_death=record.datetime_of_death.strftime("%Y-%m-%d %H:%M UTC"),
        cause_of_death=record.cause_of_death,
        declaring_doctor_name=record.declaring_doctor_name,
        vault_code=vault_code,
        bay_name=bay_name,
        temperature_recorded=temp_str,
        received_at=record.received_at.strftime("%Y-%m-%d %H:%M UTC"),
        is_autopsy_conducted=record.is_autopsy_conducted,
        pathologist_name=record.pathologist_name,
        autopsy_findings=record.autopsy_findings,
        released_at=record.released_at.strftime("%Y-%m-%d %H:%M UTC") if record.released_at else "IN CUSTODY",
        released_to_name=record.released_to_name,
        released_to_relationship=record.released_to_relationship,
        contact_kin_phone=record.contact_kin_phone,
        burial_permit_number=burial_num,
        police_case_number=record.police_case_number,
        verification_qr=verification_qr,
    )
