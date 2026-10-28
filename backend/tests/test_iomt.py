"""
Tests for IoMT Bedside Medical Telemetry and Automated Clinical Alarms.
"""
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.iomt import AlarmSeverity, DeviceType, IoMTDevice


@pytest.mark.asyncio
async def test_iomt_telemetry_and_clinical_alarms(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Test bedside monitor registration, streaming telemetry, and automated threshold alerts."""
    # 1. Register Bedside Monitor
    device_payload = {
        "device_uid": "MON-ICU-08",
        "name": "Mindray BeneVision N17",
        "device_type": "bedside_monitor",
        "ward": "Intensive Care Unit (ICU)",
        "bed_number": "Bed 08",
        "current_patient_id": 1,
    }
    dev_res = await client.post("/api/v1/iomt/devices", json=device_payload, headers=doctor_auth_headers)
    assert dev_res.status_code == 201
    dev_id = dev_res.json()["id"]

    # 2. Ingest Critical Hypoxia Vital (SpO2 = 84%)
    hypoxia_vital = {
        "device_id": dev_id,
        "patient_id": 1,
        "heart_rate_bpm": 88,
        "spo2_percent": 84,  # Triggers critical hypoxia alarm (< 90%)
        "systolic_bp_mmhg": 115,
        "diastolic_bp_mmhg": 75,
        "temperature_celsius": 37.1,
    }
    v1_res = await client.post("/api/v1/iomt/telemetry", json=hypoxia_vital, headers=doctor_auth_headers)
    assert v1_res.status_code == 201

    # 3. Check that Telemetry Alarm was triggered
    alarm_res = await client.get("/api/v1/iomt/alarms?unacknowledged_only=true", headers=doctor_auth_headers)
    assert alarm_res.status_code == 200
    alarms = alarm_res.json()
    assert len(alarms) >= 1
    hypoxia_alarm = next(a for a in alarms if "Hypoxia" in a["alarm_title"])
    assert hypoxia_alarm["severity"] == "critical"
    alarm_id = hypoxia_alarm["id"]

    # 4. Clinician acknowledges alarm
    ack_res = await client.post(f"/api/v1/iomt/alarms/{alarm_id}/acknowledge", headers=doctor_auth_headers)
    assert ack_res.status_code == 200
    assert ack_res.json()["is_acknowledged"] is True
