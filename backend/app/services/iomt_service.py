"""
IoMT (Internet of Medical Things) Telemetry & Bedside Alarm service.
Evaluates continuous vitals streams (Heart rate, SpO2, NIBP) and triggers immediate clinical alarms.
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set

from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.iomt import (
    AlarmSeverity,
    IoMTDevice,
    TelemetryAlarm,
    VitalTelemetry,
)
from app.schemas.iomt import VitalTelemetryCreate


class IoMTConnectionManager:
    """Manages real-time WebSockets streaming bedside vitals to ICU central nurse stations."""

    def __init__(self):
        self.device_listeners: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, device_uid: str):
        await websocket.accept()
        if device_uid not in self.device_listeners:
            self.device_listeners[device_uid] = set()
        self.device_listeners[device_uid].add(websocket)

    def disconnect(self, websocket: WebSocket, device_uid: str):
        if device_uid in self.device_listeners:
            self.device_listeners[device_uid].discard(websocket)

    async def broadcast_vitals(self, device_uid: str, data: dict):
        targets = set()
        if device_uid in self.device_listeners:
            targets.update(self.device_listeners[device_uid])
        if "ALL" in self.device_listeners:
            targets.update(self.device_listeners["ALL"])

        for conn in targets:
            try:
                await conn.send_json(data)
            except Exception:
                pass


iomt_stream_manager = IoMTConnectionManager()


async def ingest_patient_vitals(
    db: AsyncSession,
    telemetry_in: VitalTelemetryCreate,
) -> VitalTelemetry:
    """Ingest bedside vital signs datapoint and evaluate clinical threshold alarms."""
    now = datetime.now(timezone.utc)
    vital = VitalTelemetry(
        device_id=telemetry_in.device_id,
        patient_id=telemetry_in.patient_id,
        heart_rate_bpm=telemetry_in.heart_rate_bpm,
        spo2_percent=telemetry_in.spo2_percent,
        systolic_bp_mmhg=telemetry_in.systolic_bp_mmhg,
        diastolic_bp_mmhg=telemetry_in.diastolic_bp_mmhg,
        respiratory_rate=telemetry_in.respiratory_rate,
        temperature_celsius=telemetry_in.temperature_celsius,
        recorded_at=now,
    )
    db.add(vital)

    # Automated Clinical Threshold Safety Checks
    # 1. Hypoxia Alarm (SpO2 < 90%)
    if telemetry_in.spo2_percent < 90:
        alarm = TelemetryAlarm(
            device_id=telemetry_in.device_id,
            patient_id=telemetry_in.patient_id,
            alarm_title="Severe Hypoxia Detected",
            severity=AlarmSeverity.CRITICAL,
            metric_value=f"SpO2: {telemetry_in.spo2_percent}%",
            triggered_at=now,
            is_acknowledged=False,
        )
        db.add(alarm)

    # 2. Severe Tachycardia (HR > 130 BPM)
    if telemetry_in.heart_rate_bpm > 130:
        alarm = TelemetryAlarm(
            device_id=telemetry_in.device_id,
            patient_id=telemetry_in.patient_id,
            alarm_title="Severe Tachycardia Detected",
            severity=AlarmSeverity.WARNING,
            metric_value=f"Heart Rate: {telemetry_in.heart_rate_bpm} BPM",
            triggered_at=now,
            is_acknowledged=False,
        )
        db.add(alarm)

    await db.commit()
    await db.refresh(vital)
    return vital
