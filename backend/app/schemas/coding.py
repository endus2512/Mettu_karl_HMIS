"""
Pydantic schemas for Medical Coding Standards (ICD-10 / ICD-11 & LOINC).
"""
from typing import Optional
from pydantic import BaseModel


class ICD10Response(BaseModel):
    id: int
    code: str
    description_en: str
    description_om: Optional[str] = None
    description_am: Optional[str] = None
    chapter: str
    block: Optional[str] = None

    model_config = {"from_attributes": True}


class LOINCResponse(BaseModel):
    id: int
    code: str
    component: str
    system: str
    scale_type: str

    model_config = {"from_attributes": True}
