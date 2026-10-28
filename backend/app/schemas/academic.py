"""
Pydantic schemas for Research, Clinical Trials (IRB), and Academic Training Logbooks.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.academic import IRBStatus, ProcedureRole


class IRBProtocolCreate(BaseModel):
    protocol_number: str
    study_title: str
    principal_investigator_name: str
    pi_email: EmailStr
    department: str
    sample_size_target: int = 100


class IRBProtocolResponse(IRBProtocolCreate):
    id: int
    status: IRBStatus
    approval_date: Optional[date] = None
    enrolled_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AcademicLogbookCreate(BaseModel):
    patient_id: Optional[int] = None
    procedure_name: str
    role: ProcedureRole = ProcedureRole.PRIMARY_OPERATOR
    performed_date: date
    clinical_notes: Optional[str] = None


class AcademicLogbookResponse(AcademicLogbookCreate):
    id: int
    trainee_id: int
    supervisor_id: Optional[int] = None
    supervisor_verified: bool

    model_config = {"from_attributes": True}
