"""
Pydantic schemas for Hospital Mortuary, Cold Vaults, and Autopsy Logs.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.mortuary import VaultStatus


class BodyVaultResponse(BaseModel):
    id: int
    vault_code: str
    temperature_celsius: float
    status: VaultStatus

    model_config = {"from_attributes": True}


class MortuaryRecordCreate(BaseModel):
    patient_id: Optional[int] = None
    deceased_name: str
    gender: str
    datetime_of_death: datetime
    cause_of_death: str
    declaring_doctor_name: str
    body_vault_id: Optional[int] = None
    death_certificate_number: Optional[str] = None
    is_autopsy_conducted: bool = False


class MortuaryRecordResponse(MortuaryRecordCreate):
    id: int
    tag_number: str
    received_at: datetime
    released_at: Optional[datetime] = None
    released_to_name: Optional[str] = None
    released_to_relationship: Optional[str] = None

    model_config = {"from_attributes": True}


class ReleaseDeceasedRequest(BaseModel):
    released_to_name: str
    released_to_relationship: str
    death_certificate_number: str
