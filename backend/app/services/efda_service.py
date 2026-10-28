"""
Ethiopian Food and Drug Authority (EFDA) Pharmacovigilance & Drug Safety service.
Handles Adverse Drug Reaction (ADR Yellow Form) reporting and batch recall alerts.
"""
from datetime import datetime, timezone
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.efda import ADRStatus, EFDADrugRecall, EFDAPharmacovigilanceReport
from app.schemas.efda import ADRReportCreate, DrugRecallCreate


async def submit_adr_yellow_form(
    db: AsyncSession,
    report_in: ADRReportCreate,
) -> EFDAPharmacovigilanceReport:
    """Register hospital ADR Yellow Form for regulatory submission to EFDA."""
    rep_num = f"ADR-MKH-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:5].upper()}"
    report = EFDAPharmacovigilanceReport(
        report_number=rep_num,
        **report_in.model_dump(),
        status=ADRStatus.SUBMITTED,
        created_at=datetime.now(timezone.utc),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


async def broadcast_drug_recall(
    db: AsyncSession,
    recall_in: DrugRecallCreate,
) -> EFDADrugRecall:
    """Broadcast substandard medicine recall to hospital pharmacy inventory."""
    recall = EFDADrugRecall(
        **recall_in.model_dump(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(recall)
    await db.commit()
    await db.refresh(recall)
    return recall
