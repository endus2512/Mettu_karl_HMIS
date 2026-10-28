"""
FHIR R4 Patient resource mapper and schemas.

Converts internal Patient ORM records into standard HL7 FHIR R4 Patient resources
and validates incoming FHIR R4 payloads.
"""
from datetime import date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FHIRIdentifier(BaseModel):
    system: str
    value: str
    use: str = "official"


class FHIRHumanName(BaseModel):
    use: str = "official"
    family: str
    given: List[str]


class FHIRTelecom(BaseModel):
    system: str
    value: str
    use: str = "mobile"


class FHIRAddress(BaseModel):
    use: str = "home"
    line: List[str] = Field(default_factory=list)
    city: Optional[str] = None
    state: Optional[str] = None
    postalCode: Optional[str] = None
    country: str = "ETH"


class FHIRPatientResource(BaseModel):
    """FHIR R4 Patient Resource representation."""
    resourceType: str = "Patient"
    id: str
    active: bool = True
    identifier: List[FHIRIdentifier] = Field(default_factory=list)
    name: List[FHIRHumanName] = Field(default_factory=list)
    telecom: List[FHIRTelecom] = Field(default_factory=list)
    gender: str
    birthDate: str
    address: List[FHIRAddress] = Field(default_factory=list)


class FHIRBundleEntry(BaseModel):
    fullUrl: str
    resource: FHIRPatientResource


class FHIRPatientBundle(BaseModel):
    """FHIR R4 Searchset Bundle."""
    resourceType: str = "Bundle"
    type: str = "searchset"
    total: int
    entry: List[FHIRBundleEntry] = Field(default_factory=list)


def patient_to_fhir_dict(patient: Any) -> Dict[str, Any]:
    """
    Convert an internal Patient ORM model into a standard FHIR R4 Patient dictionary.
    """
    telecoms = []
    if patient.phone_number:
        telecoms.append({"system": "phone", "value": patient.phone_number, "use": "mobile"})
    if patient.email:
        telecoms.append({"system": "email", "value": patient.email, "use": "home"})

    address_lines = [patient.address_line] if patient.address_line else []
    addresses = [
        {
            "use": "home",
            "line": address_lines,
            "city": patient.city or "Mettu",
            "state": patient.state_province or "Oromia",
            "postalCode": patient.postal_code or "",
            "country": "ETH",
        }
    ]

    return {
        "resourceType": "Patient",
        "id": patient.fhir_id,
        "active": patient.is_active,
        "identifier": [
            {
                "use": "official",
                "system": "urn:oid:mettu-karl:mrn",
                "value": patient.mrn,
            }
        ],
        "name": [
            {
                "use": "official",
                "family": patient.last_name,
                "given": [patient.first_name],
            }
        ],
        "telecom": telecoms,
        "gender": patient.gender.value if hasattr(patient.gender, "value") else str(patient.gender),
        "birthDate": patient.birth_date.isoformat() if isinstance(patient.birth_date, date) else str(patient.birth_date),
        "address": addresses,
    }
