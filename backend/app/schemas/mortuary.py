"""
Pydantic schemas for Hospital Mortuary, Cold Vaults, and Autopsy Logs.
"""
from datetime import datetime, date, timezone
from typing import Optional

from pydantic import BaseModel, model_validator

from app.models.mortuary import VaultStatus


class BodyVaultResponse(BaseModel):
    id: int
    vault_code: str
    vault_number: Optional[str] = None
    bay_name: Optional[str] = None
    temperature_celsius: float
    status: str

    model_config = {"from_attributes": True}


class MortuaryRecordCreate(BaseModel):
    patient_id: Optional[int] = None
    deceased_name: str
    gender: Optional[str] = "UNKNOWN"
    datetime_of_death: Optional[datetime] = None
    date_of_death: Optional[str] = None
    time_of_death: Optional[str] = None
    cause_of_death: str
    declaring_doctor_name: Optional[str] = None
    certifying_physician: Optional[str] = None
    body_vault_id: Optional[int] = None
    vault_id: Optional[int] = None
    death_certificate_number: Optional[str] = None
    is_autopsy_conducted: bool = False
    contact_kin_name: Optional[str] = None
    contact_kin_phone: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: dict):
        if not isinstance(data, dict):
            return data
        if "certifying_physician" in data and "declaring_doctor_name" not in data:
            data["declaring_doctor_name"] = data["certifying_physician"]
        elif "declaring_doctor_name" in data and "certifying_physician" not in data:
            data["certifying_physician"] = data["declaring_doctor_name"]

        if "vault_id" in data and "body_vault_id" not in data:
            data["body_vault_id"] = data["vault_id"]
        elif "body_vault_id" in data and "vault_id" not in data:
            data["vault_id"] = data["body_vault_id"]

        if "datetime_of_death" not in data or data["datetime_of_death"] is None:
            dod_d = data.get("date_of_death")
            dod_t = data.get("time_of_death")
            if dod_d:
                dt_str = f"{dod_d} {dod_t or '00:00:00'}"
                try:
                    data["datetime_of_death"] = datetime.fromisoformat(dt_str).replace(tzinfo=timezone.utc)
                except Exception:
                    data["datetime_of_death"] = datetime.now(timezone.utc)
            else:
                data["datetime_of_death"] = datetime.now(timezone.utc)

        if "declaring_doctor_name" not in data or not data["declaring_doctor_name"]:
            data["declaring_doctor_name"] = "Attending Hospital Physician"

        return data


class MortuaryRecordResponse(BaseModel):
    id: int
    tag_number: str
    patient_id: Optional[int] = None
    deceased_name: str
    gender: str
    datetime_of_death: datetime
    cause_of_death: str
    declaring_doctor_name: str
    body_vault_id: Optional[int] = None
    vault_id: Optional[int] = None
    death_certificate_number: Optional[str] = None
    is_autopsy_conducted: bool = False
    received_at: datetime
    released_at: Optional[datetime] = None
    released_to_name: Optional[str] = None
    released_to_relationship: Optional[str] = None
    contact_kin_name: Optional[str] = None
    contact_kin_phone: Optional[str] = None
    released_to_kin: bool = False

    model_config = {"from_attributes": True}


class ReleaseDeceasedRequest(BaseModel):
    released_to_name: Optional[str] = "Next of Kin"
    released_to_relationship: Optional[str] = "Family Member"
    death_certificate_number: Optional[str] = None
