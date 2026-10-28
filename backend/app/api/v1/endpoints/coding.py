"""
Medical Coding Standards (ICD-10 / ICD-11 & LOINC) search endpoints.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.coding import ICD10Code, LOINCCode
from app.models.user import User
from app.schemas.coding import ICD10Response, LOINCResponse

router = APIRouter()


@router.get("/icd10", response_model=List[ICD10Response], summary="Search ICD-10 Diagnoses")
async def search_icd10(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=2, description="Search term in English, Afaan Oromoo, or code"),
    limit: int = Query(20, ge=1, le=100),
) -> List[ICD10Code]:
    """Search international ICD-10 disease codes."""
    pattern = f"%{q}%"
    stmt = (
        select(ICD10Code)
        .where(
            or_(
                ICD10Code.code.ilike(pattern),
                ICD10Code.description_en.ilike(pattern),
                ICD10Code.description_om.ilike(pattern),
                ICD10Code.description_am.ilike(pattern),
            )
        )
        .limit(limit)
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/loinc", response_model=List[LOINCResponse], summary="Search LOINC Lab & Radiology Codes")
async def search_loinc(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=2, description="Search lab analyte, method, or code"),
    limit: int = Query(20, ge=1, le=100),
) -> List[LOINCCode]:
    """Search LOINC observation identifiers."""
    pattern = f"%{q}%"
    stmt = (
        select(LOINCCode)
        .where(
            or_(
                LOINCCode.code.ilike(pattern),
                LOINCCode.component.ilike(pattern),
            )
        )
        .limit(limit)
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())
