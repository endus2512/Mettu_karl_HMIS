"""
Tests for FHIR R4 Patient resource endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_read_fhir_patient(client: AsyncClient, doctor_auth_headers: dict[str, str]):
    """Test creating a patient and reading it as a FHIR R4 resource."""
    patient_payload = {
        "first_name": "Tolosa",
        "last_name": "Bekele",
        "birth_date": "1990-05-14",
        "gender": "male",
        "phone_number": "+251911223344",
        "email": "tolosa.bekele@example.com",
        "address_line": "Kebele 02, House 104",
        "city": "Mettu",
        "state_province": "Oromia",
        "postal_code": "1000",
    }

    # 1. Create Patient via FHIR endpoint
    create_res = await client.post(
        "/api/v1/fhir/r4/Patient",
        json=patient_payload,
        headers=doctor_auth_headers,
    )
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["resourceType"] == "Patient"
    assert created_data["gender"] == "male"
    assert created_data["name"][0]["family"] == "Bekele"
    assert "id" in created_data

    fhir_id = created_data["id"]

    # 2. Read Patient by FHIR ID
    read_res = await client.get(
        f"/api/v1/fhir/r4/Patient/{fhir_id}",
        headers=doctor_auth_headers,
    )
    assert read_res.status_code == 200
    read_data = read_res.json()
    assert read_data["id"] == fhir_id
    assert read_data["active"] is True


@pytest.mark.asyncio
async def test_search_fhir_patients_bundle(client: AsyncClient, doctor_auth_headers: dict[str, str]):
    """Test searching patients returns a valid FHIR R4 searchset Bundle."""
    response = await client.get(
        "/api/v1/fhir/r4/Patient?name=Tolosa",
        headers=doctor_auth_headers,
    )
    assert response.status_code == 200
    bundle = response.json()
    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "searchset"
    assert "total" in bundle
