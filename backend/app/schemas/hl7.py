"""
Pydantic schemas for HL7 v2.x (ORU^R01) MLLP Lab Analyzer Integration.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class HL7TestParameter(BaseModel):
    parameter_code: str
    parameter_name: str
    value: float
    unit: str
    reference_range: str
    flag: str = "N"  # N = Normal, H = High, L = Low, PANIC = Critical panic


class HL7IngestRequest(BaseModel):
    raw_hl7_message: str = Field(..., description="Raw HL7 v2.5 ORU^R01 message string with MSH, PID, OBR, OBX segments")
    analyzer_model: Optional[str] = Field("Sysmex XN-550 Hematology", description="Instrument identifier")
    instrument_serial: Optional[str] = Field("SYS-XN550-METTU-01", description="Laboratory instrument serial number")


class HL7IngestResponse(BaseModel):
    status: str = "success"
    message_control_id: str
    sending_analyzer: str
    patient_mrn: str
    patient_name: str
    order_test_name: str
    parameters_count: int
    parameters: List[HL7TestParameter]
    has_panic_alert: bool
    ack_message: str
    ingested_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyzerTelemetry(BaseModel):
    instrument_id: str
    instrument_name: str
    modality: str  # Hematology, Biochemistry, Immunology, Molecular
    ip_address: str
    port: int
    mllp_online: bool
    last_sync: datetime
    total_messages_received: int
