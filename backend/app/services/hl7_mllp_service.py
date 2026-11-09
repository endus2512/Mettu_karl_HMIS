"""
HL7 v2.x (ORU^R01) MLLP Lab Instrument Ingestion Service.
Parses MLLP packet framing (<VT> ... <FS><CR>) and standard HL7 v2.5 clinical lab
observation segments (MSH, PID, OBR, OBX) from Sysmex, Mindray, and Beckman analyzers.
"""
from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.laboratory import LabCategory, LabOrder, LabOrderItem, LabOrderStatus, LabResult, ResultFlag
from app.models.patient import Patient
from app.schemas.hl7 import HL7IngestResponse, HL7TestParameter

logger = logging.getLogger("mkh.hl7_mllp")

# MLLP (Minimal Lower Layer Protocol) Framing Constants
MLLP_START_BLOCK = b"\x0b"  # <VT> Vertical Tab (11)
MLLP_END_BLOCK = b"\x1c\x0d"  # <FS><CR> File Separator (28) + Carriage Return (13)


def wrap_mllp_frame(hl7_payload: str) -> bytes:
    """Encapsulate an HL7 string inside standard MLLP transport framing."""
    return MLLP_START_BLOCK + hl7_payload.encode("utf-8") + MLLP_END_BLOCK


def unwrap_mllp_frame(raw_bytes: bytes) -> str:
    """Extract raw HL7 ASCII payload by stripping MLLP framing bytes."""
    data = raw_bytes
    if data.startswith(MLLP_START_BLOCK):
        data = data[1:]
    if data.endswith(MLLP_END_BLOCK):
        data = data[:-2]
    return data.decode("utf-8", errors="replace").strip()


def parse_hl7_v2_oru_r01(hl7_text: str) -> Dict[str, Any]:
    """
    Parse HL7 v2.5 ORU^R01 Observation Report.
    Extracts MSH, PID, OBR, and OBX segments into structured dictionary.
    """
    lines = [line.strip() for line in re.split(r"[\r\n]+", hl7_text) if line.strip()]
    if not lines:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty HL7 message payload")

    msh_fields: List[str] = []
    pid_fields: List[str] = []
    obr_fields: List[str] = []
    obx_list: List[List[str]] = []

    for line in lines:
        parts = line.split("|")
        seg_id = parts[0].upper()
        if seg_id == "MSH":
            msh_fields = parts
        elif seg_id == "PID":
            pid_fields = parts
        elif seg_id == "OBR":
            obr_fields = parts
        elif seg_id == "OBX":
            obx_list.append(parts)

    if not msh_fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing required HL7 MSH header segment")

    # MSH segment parsing (Field index offset: MSH| is counted as index 0)
    sending_app = msh_fields[2] if len(msh_fields) > 2 else "GENERIC_ANALYZER"
    control_id = msh_fields[9] if len(msh_fields) > 9 else f"MSG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    # PID segment parsing
    patient_mrn = pid_fields[3] if len(pid_fields) > 3 else "MKH-UNKNOWN"
    patient_name_raw = pid_fields[5] if len(pid_fields) > 5 else "Walk-in^Patient"
    patient_name = " ".join(patient_name_raw.split("^"))

    # OBR segment parsing
    test_name = obr_fields[4].split("^")[1] if len(obr_fields) > 4 and "^" in obr_fields[4] else (
        obr_fields[4] if len(obr_fields) > 4 else "Automated Profile"
    )

    # OBX segments parsing
    parameters: List[HL7TestParameter] = []
    has_panic = False

    for obx in obx_list:
        if len(obx) < 6:
            continue
        param_code_parts = obx[3].split("^")
        code = param_code_parts[0]
        name = param_code_parts[1] if len(param_code_parts) > 1 else code
        try:
            val = float(obx[5])
        except (ValueError, TypeError):
            val = 0.0

        unit = obx[6] if len(obx) > 6 else ""
        ref_range = obx[7] if len(obx) > 7 else ""
        flag = obx[8].upper() if len(obx) > 8 else "N"

        if flag in ["PANIC", "CRITICAL", "HH", "LL"]:
            has_panic = True
            flag = "PANIC"
        elif flag in ["H", "HIGH"]:
            flag = "H"
        elif flag in ["L", "LOW"]:
            flag = "L"
        else:
            flag = "N"

        parameters.append(
            HL7TestParameter(
                parameter_code=code,
                parameter_name=name,
                value=val,
                unit=unit,
                reference_range=ref_range,
                flag=flag,
            )
        )

    # Generate HL7 ACK (Accept Acknowledgement)
    now_hl7 = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    ack_msg = (
        f"MSH|^~\\&|METTU_KARL_HIS|METTU_KARL|{sending_app}|LAB|{now_hl7}||ACK|{control_id}|P|2.5\r"
        f"MSA|AA|{control_id}|Results Ingested Successfully\r"
    )

    return {
        "message_control_id": control_id,
        "sending_analyzer": sending_app,
        "patient_mrn": patient_mrn,
        "patient_name": patient_name,
        "order_test_name": test_name,
        "parameters": parameters,
        "has_panic": has_panic,
        "ack_message": ack_msg,
    }


def generate_sample_sysmex_hl7(mrn: str = "MKH-2026-000101", patient_name: str = "Gudeta^Hailu") -> str:
    """Generate a realistic HL7 v2.5 ORU^R01 message string for Sysmex XN-550 hematology analyzer."""
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    control_id = f"XN550-{datetime.now(timezone.utc).strftime('%H%M%S')}"

    return (
        f"MSH|^~\\&|SYSMEX_XN550|METTU_KARL_LAB|METTU_HIS|LAB|{now_str}||ORU^R01|{control_id}|P|2.5\r"
        f"PID|1||{mrn}||{patient_name}||19880514|M\r"
        f"OBR|1|ORD-{control_id}|AN-{control_id}|CBC^Complete Blood Count^LN|||{now_str}\r"
        f"OBX|1|NM|WBC^White Blood Cell Count^LN||6.8|10^3/uL|4.0-10.0|N|||F\r"
        f"OBX|2|NM|RBC^Red Blood Cell Count^LN||4.85|10^6/uL|4.20-5.40|N|||F\r"
        f"OBX|3|NM|HGB^Hemoglobin^LN||14.2|g/dL|12.0-16.0|N|||F\r"
        f"OBX|4|NM|HCT^Hematocrit^LN||42.1|%|37.0-48.0|N|||F\r"
        f"OBX|5|NM|PLT^Platelet Count^LN||225|10^3/uL|150-450|N|||F\r"
        f"OBX|6|NM|NEUT_PCT^Neutrophils Percent^LN||62.4|%|40.0-70.0|N|||F\r"
    )
