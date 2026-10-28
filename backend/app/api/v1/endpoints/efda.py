"""
Ethiopian Food and Drug Authority (EFDA) Compliance & Drug Safety Endpoints.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.efda import ADRSeverity, EFDADrugRecall, EFDAPharmacovigilanceReport
from app.models.user import User
from app.schemas.efda import (
    ADRReportCreate,
    ADRReportResponse,
    DrugRecallCreate,
    DrugRecallResponse,
)
from app.services.efda_service import broadcast_drug_recall, submit_adr_yellow_form

router = APIRouter()


@router.post("/adr-reports", response_model=ADRReportResponse, status_code=status.HTTP_201_CREATED, summary="Submit ADR Yellow Form")
async def report_adr(
    report_in: ADRReportCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EFDAPharmacovigilanceReport:
    """Submit Adverse Drug Reaction report for national pharmacovigilance oversight."""
    return await submit_adr_yellow_form(db=db, report_in=report_in)


@router.get("/adr-reports", response_model=List[ADRReportResponse], summary="List ADR Reports")
async def list_adr_reports(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    severity: Optional[ADRSeverity] = Query(None, description="Filter by ADR severity"),
) -> List[EFDAPharmacovigilanceReport]:
    """Retrieve logged pharmacovigilance reports."""
    query = select(EFDAPharmacovigilanceReport).order_by(EFDAPharmacovigilanceReport.created_at.desc())
    if severity:
        query = query.where(EFDAPharmacovigilanceReport.severity == severity)
    res = await db.execute(query)
    return list(res.scalars().all())


@router.post("/recalls", response_model=DrugRecallResponse, status_code=status.HTTP_201_CREATED, summary="Broadcast EFDA Drug Recall")
async def broadcast_recall(
    recall_in: DrugRecallCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EFDADrugRecall:
    """Publish regulatory medicine recall alert and enforce pharmacy quarantine."""
    return await broadcast_drug_recall(db=db, recall_in=recall_in)


@router.get("/recalls", response_model=List[DrugRecallResponse], summary="List Drug Recalls")
async def list_drug_recalls(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[EFDADrugRecall]:
    """Retrieve active drug recalls and safety quarantine directives."""
    res = await db.execute(select(EFDADrugRecall).order_by(EFDADrugRecall.issued_date.desc()))
    return list(res.scalars().all())
