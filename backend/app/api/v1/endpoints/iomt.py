"""
IoMT Medical Telemetry and Real-Time Vital Alerts Endpoints.
"""
from datetime import datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.iomt import AlarmSeverity, IoMTDevice, TelemetryAlarm, VitalTelemetry
from app.models.user import User
from app.schemas.iomt import (
    IoMTDeviceCreate,
    IoMTDeviceResponse,
    TelemetryAlarmResponse,
    VitalTelemetryCreate,
    VitalTelemetryResponse,
)
from app.services.iomt_service import ingest_patient_vitals, iomt_stream_manager

router = APIRouter()


@router.post("/devices", response_model=IoMTDeviceResponse, status_code=status.HTTP_201_CREATED, summary="Register IoMT Device")
async def register_iomt_device(
    device_in: IoMTDeviceCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> IoMTDevice:
    """Register bedside patient monitor, pulse oximeter, or ECG telemetry unit."""
    device = IoMTDevice(
        **device_in.model_dump(),
        is_online=True,
        last_ping=datetime.now(timezone.utc),
    )
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return device


@router.get("/devices", response_model=List[IoMTDeviceResponse], summary="List IoMT Devices")
async def list_iomt_devices(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    ward: Optional[str] = Query(None, description="Filter devices by hospital ward (e.g. ICU, NICU)"),
) -> List[IoMTDevice]:
    """Retrieve connected bedside telemetry monitors."""
    query = select(IoMTDevice).order_by(IoMTDevice.ward, IoMTDevice.bed_number)
    if ward:
        query = query.where(IoMTDevice.ward == ward)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/telemetry", response_model=VitalTelemetryResponse, status_code=status.HTTP_201_CREATED, summary="Ingest Bedside Vitals Telemetry")
async def ingest_telemetry(
    telemetry_in: VitalTelemetryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> VitalTelemetry:
    """Ingest bedside vital sign telemetry datapoint and evaluate clinical threshold alarms."""
    # Ensure device exists
    dev_res = await db.execute(select(IoMTDevice).where(IoMTDevice.id == telemetry_in.device_id))
    device = dev_res.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="IoMT Device not found")

    device.last_ping = datetime.now(timezone.utc)
    device.is_online = True

    vital = await ingest_patient_vitals(db=db, telemetry_in=telemetry_in)

    # Real-time WebSocket broadcast to ICU Central Nurse Stations
    await iomt_stream_manager.broadcast_vitals(
        device_uid=device.device_uid,
        data={
            "device_uid": device.device_uid,
            "ward": device.ward,
            "bed_number": device.bed_number,
            "patient_id": telemetry_in.patient_id,
            "heart_rate_bpm": telemetry_in.heart_rate_bpm,
            "spo2_percent": telemetry_in.spo2_percent,
            "systolic_bp_mmhg": telemetry_in.systolic_bp_mmhg,
            "diastolic_bp_mmhg": telemetry_in.diastolic_bp_mmhg,
            "respiratory_rate": telemetry_in.respiratory_rate,
            "temperature_celsius": telemetry_in.temperature_celsius,
            "recorded_at": vital.recorded_at.isoformat(),
        },
    )

    return vital


@router.get("/alarms", response_model=List[TelemetryAlarmResponse], summary="List Telemetry Alarms")
async def list_telemetry_alarms(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    severity: Optional[AlarmSeverity] = Query(None, description="Filter alarms by severity level"),
    unacknowledged_only: bool = Query(True, description="Filter for unacknowledged alarms"),
) -> List[TelemetryAlarm]:
    """Retrieve bedside clinical telemetry alarms."""
    query = select(TelemetryAlarm).order_by(TelemetryAlarm.triggered_at.desc())
    if severity:
        query = query.where(TelemetryAlarm.severity == severity)
    if unacknowledged_only:
        query = query.where(TelemetryAlarm.is_acknowledged == False)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/alarms/{alarm_id}/acknowledge", response_model=TelemetryAlarmResponse, summary="Acknowledge Clinical Alarm")
async def acknowledge_alarm(
    alarm_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TelemetryAlarm:
    """Nurse or clinician sign-off / acknowledgment of clinical vital alert."""
    result = await db.execute(select(TelemetryAlarm).where(TelemetryAlarm.id == alarm_id))
    alarm = result.scalar_one_or_none()
    if not alarm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Telemetry alarm not found")

    alarm.is_acknowledged = True
    await db.commit()
    await db.refresh(alarm)
    return alarm


@router.websocket("/ws/{device_uid}")
async def websocket_device_stream(websocket: WebSocket, device_uid: str):
    """Real-time bi-directional vital sign streaming socket for ICU Nurse Stations."""
    await iomt_stream_manager.connect(websocket, device_uid)
    try:
        while True:
            # Keep socket open and await any inbound pings/commands
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        iomt_stream_manager.disconnect(websocket, device_uid)
