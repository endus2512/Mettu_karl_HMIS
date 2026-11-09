"""
Tests for Edge Data Synchronization and Offline-First PWA Engine.
Validates idempotent batch ingestion, patient deduplication/merging,
and vitals/prescription synchronization from Southwestern Ethiopia outreach posts.
"""
from datetime import date, datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_sync_status_endpoint(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
):
    """Test central sync engine status check."""
    res = await client.get("/api/v1/sync/status", headers=doctor_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert data["conflict_resolution_strategy"] == "last_write_wins_with_patient_merge"
    assert data["active_edge_stations_count"] >= 1


@pytest.mark.asyncio
async def test_edge_batch_sync_new_patient_and_vitals(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
):
    """Test ingestion of offline batch containing new patient, vitals observation, and prescription."""
    payload = {
        "station_id": "CLINIC-HURUMU-01",
        "station_name": "Hurumu Outreach Health Post",
        "batch_timestamp": datetime.now(timezone.utc).isoformat(),
        "patients": [
            {
                "temp_id": "OFFLINE-PAT-901",
                "first_name": "Bonsa",
                "last_name": "Tadesse",
                "birth_date": "1994-08-15",
                "gender": "male",
                "phone_number": "+251917882233",
                "kebele": "Hurumu 02",
                "woreda": "Hurumu",
                "created_offline_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "observations": [
            {
                "temp_id": "OFFLINE-OBS-101",
                "patient_mrn": "OFFLINE-PAT-901",
                "vital_type": "spo2",
                "value": "97",
                "unit": "%",
                "recorded_offline_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "temp_id": "OFFLINE-OBS-102",
                "patient_mrn": "OFFLINE-PAT-901",
                "vital_type": "heart_rate",
                "value": "78",
                "unit": "bpm",
                "recorded_offline_at": datetime.now(timezone.utc).isoformat(),
            },
        ],
        "prescriptions": [
            {
                "temp_id": "OFFLINE-RX-501",
                "patient_mrn": "OFFLINE-PAT-901",
                "medications": [
                    {"name": "Amoxicillin 500mg", "dosage": "1 cap PO TID x 7d", "quantity": 21}
                ],
                "prescribed_offline_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }

    res = await client.post("/api/v1/sync/edge-batch", json=payload, headers=doctor_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["station_id"] == "CLINIC-HURUMU-01"
    assert data["patients_processed"] == 1
    assert data["observations_processed"] == 2
    assert data["prescriptions_processed"] == 1
    assert len(data["resolutions"]) == 4

    pat_res = next(r for r in data["resolutions"] if r["temp_id"] == "OFFLINE-PAT-901")
    assert pat_res["status"] == "RESOLVED_INSERTED"
    assert pat_res["permanent_id"] > 0


@pytest.mark.asyncio
async def test_edge_batch_sync_idempotent_merge(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
):
    """
    Test duplicate offline submission with identical phone & name.
    Server must merge into existing record rather than failing on duplicate keys.
    """
    # First submission: Patient is inserted
    payload_initial = {
        "station_id": "CLINIC-HURUMU-01",
        "station_name": "Hurumu Outreach Health Post",
        "batch_timestamp": datetime.now(timezone.utc).isoformat(),
        "patients": [
            {
                "temp_id": "OFFLINE-PAT-ORIGINAL",
                "first_name": "Obsan",
                "last_name": "Bekele",
                "birth_date": "1990-01-01",
                "gender": "male",
                "phone_number": "+251911445566",
                "kebele": "Hurumu 01",
                "woreda": "Hurumu",
                "created_offline_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "observations": [],
        "prescriptions": [],
    }
    res1 = await client.post("/api/v1/sync/edge-batch", json=payload_initial, headers=doctor_auth_headers)
    assert res1.status_code == 200
    assert res1.json()["resolutions"][0]["status"] == "RESOLVED_INSERTED"

    # Second submission: Same phone & name from another edge sync queue -> Merged idempotently
    payload_duplicate = {
        "station_id": "CLINIC-HURUMU-01",
        "station_name": "Hurumu Outreach Health Post",
        "batch_timestamp": datetime.now(timezone.utc).isoformat(),
        "patients": [
            {
                "temp_id": "OFFLINE-PAT-MERGE",
                "first_name": "Obsan",
                "last_name": "Bekele",
                "birth_date": "1990-01-01",
                "gender": "male",
                "phone_number": "+251911445566",
                "kebele": "Hurumu 02 Updated",
                "woreda": "Hurumu",
                "created_offline_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "observations": [],
        "prescriptions": [],
    }

    res2 = await client.post("/api/v1/sync/edge-batch", json=payload_duplicate, headers=doctor_auth_headers)
    assert res2.status_code == 200
    data = res2.json()
    pat_res = next(r for r in data["resolutions"] if r["temp_id"] == "OFFLINE-PAT-MERGE")
    assert pat_res["status"] == "RESOLVED_MERGED"
