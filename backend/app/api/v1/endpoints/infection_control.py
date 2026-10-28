"""
Infection Control, HAI Surveillance & EPHI Outbreak Alerts Endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.infection_control import (
    HAIType,
    HospitalAcquiredInfectionLog,
    PHEMDiseaseCategory,
    PHEMOutbreakReport,
)
from app.models.user import User
from app.schemas.infection_control import (
    HAILogCreate,
    HAILogResponse,
    PHEMReportCreate,
    PHEMReportResponse,
)

router = APIRouter()


@router.post("/hai-logs", response_model=HAILogResponse, status_code=status.HTTP_201_CREATED, summary="Log HAI Infection")
async def log_hai(
    hai_in: HAILogCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> HospitalAcquiredInfectionLog:
    """Log hospital-acquired infection (SSI, CAUTI, CLABSI, VAP) for IPPS audit."""
    log = HospitalAcquiredInfectionLog(
        **hai_in.model_dump(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/hai-logs", response_model=List[HAILogResponse], summary="List HAI Surveillance Logs")
async def list_hai_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    ward: Optional[str] = Query(None, description="Filter by hospital ward"),
    hai_type: Optional[HAIType] = Query(None, description="Filter by infection type"),
) -> List[HospitalAcquiredInfectionLog]:
    """Retrieve hospital-acquired infection logs for epidemiological tracking."""
    query = select(HospitalAcquiredInfectionLog).order_by(HospitalAcquiredInfectionLog.detected_date.desc())
    if ward:
        query = query.where(HospitalAcquiredInfectionLog.ward == ward)
    if hai_type:
        query = query.where(HospitalAcquiredInfectionLog.hai_type == hai_type)
    res = await db.execute(query)
    return list(res.scalars().all())


@router.post("/phem-reports", response_model=PHEMReportResponse, status_code=status.HTTP_201_CREATED, summary="Report PHEM Outbreak to EPHI")
async def report_phem(
    phem_in: PHEMReportCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PHEMOutbreakReport:
    """Submit notifiable epidemic disease report (Cholera, Measles, Malaria) to EPHI."""
    code = f"PHEM-MKH-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:5].upper()}"
    report = PHEMOutbreakReport(
        report_code=code,
        **phem_in.model_dump(),
        reported_to_ephi_at=datetime.now(timezone.utc),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.get("/phem-reports", response_model=List[PHEMReportResponse], summary="List PHEM Surveillance Reports")
async def list_phem_reports(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    disease: Optional[PHEMDiseaseCategory] = Query(None, description="Filter by notifiable epidemic disease"),
) -> List[PHEMOutbreakReport]:
    """Retrieve epidemic surveillance cases reported to national health institutes."""
    query = select(PHEMOutbreakReport).order_by(PHEMOutbreakReport.reported_to_ephi_at.desc())
    if disease:
        query = query.where(PHEMOutbreakReport.disease_category == disease)
    res = await db.execute(query)
    return list(res.scalars().all())
