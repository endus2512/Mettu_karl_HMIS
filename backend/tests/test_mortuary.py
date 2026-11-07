"""
Tests for Module 10: Hospital Mortuary, Cold Body Vaults, Autopsy, and Legal Release.
"""
from datetime import date, datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mortuary import BodyVault, MortuaryRecord, VaultStatus


@pytest.mark.asyncio
async def test_mortuary_full_lifecycle(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test full mortuary workflow: vault registration, deceased intake, autopsy, and legal release."""
    # 1. Create a cold vault
    v_res = await client.post(
        "/api/v1/mortuary/vaults",
        json={
            "vault_code": "VAULT-TEST-99",
            "bay_name": "Bay 9 Test",
            "temperature_celsius": 3.1,
        },
        headers=doctor_auth_headers,
    )
    assert v_res.status_code == 201
    vault_id = v_res.json()["id"]

    # 2. Get Stats
    stats_res = await client.get("/api/v1/mortuary/stats", headers=doctor_auth_headers)
    assert stats_res.status_code == 200
    assert "total_vaults" in stats_res.json()
    assert "occupied_vaults" in stats_res.json()

    # 3. List Vaults
    vaults_res = await client.get("/api/v1/mortuary/vaults", headers=doctor_auth_headers)
    assert vaults_res.status_code == 200
    assert any(v["id"] == vault_id for v in vaults_res.json())

    # 4. Admit Deceased
    intake_res = await client.post(
        "/api/v1/mortuary/records",
        json={
            "deceased_name": "Test Patient Gemechu",
            "gender": "MALE",
            "date_of_death": str(date.today()),
            "time_of_death": "14:20:00",
            "cause_of_death": "Cardiac Arrest secondary to Severe Sepsis",
            "certifying_physician": "Dr. Chala Worku",
            "vault_id": vault_id,
            "contact_kin_name": "Beti Gemechu (Sister)",
            "contact_kin_phone": "+251911998877",
        },
        headers=doctor_auth_headers,
    )
    assert intake_res.status_code == 201
    record_data = intake_res.json()
    rec_id = record_data["id"]
    assert record_data["deceased_name"] == "Test Patient Gemechu"
    assert record_data["body_vault_id"] == vault_id

    # 5. List Records
    recs_res = await client.get("/api/v1/mortuary/records?filter_type=custody", headers=doctor_auth_headers)
    assert recs_res.status_code == 200
    assert any(r["id"] == rec_id for r in recs_res.json())

    # 6. Record Autopsy
    autopsy_res = await client.post(
        f"/api/v1/mortuary/records/{rec_id}/autopsy",
        json={
            "pathologist_name": "Dr. Daniel Gemechu",
            "autopsy_findings": "Extensive pulmonary consolidation with acute purulent exudate.",
            "confirmed_cause_of_death": "Severe Pneumococcal Pneumonia with Septic Shock",
            "police_case_number": "POL-2026-TEST",
        },
        headers=doctor_auth_headers,
    )
    assert autopsy_res.status_code == 200
    assert autopsy_res.json()["is_autopsy_conducted"] is True
    assert autopsy_res.json()["pathologist_name"] == "Dr. Daniel Gemechu"

    # 7. Release Deceased to Next of Kin
    rel_res = await client.post(
        f"/api/v1/mortuary/records/{rec_id}/release",
        json={
            "released_to_name": "Beti Gemechu",
            "released_to_relationship": "Sister",
            "contact_kin_phone": "+251911998877",
            "death_certificate_number": "DC-MKH-2026-TEST-99",
            "burial_permit_number": "BP-MKH-TEST-99",
        },
        headers=doctor_auth_headers,
    )
    assert rel_res.status_code == 200
    assert rel_res.json()["released_to_kin"] is True
    assert rel_res.json()["released_at"] is not None

    # 8. Check Official Voucher
    vch_res = await client.get(f"/api/v1/mortuary/records/{rec_id}/voucher", headers=doctor_auth_headers)
    assert vch_res.status_code == 200
    vch = vch_res.json()
    assert vch["tin_number"] == "0038912401"
    assert vch["deceased_name"] == "Test Patient Gemechu"
    assert "verification_qr" in vch
