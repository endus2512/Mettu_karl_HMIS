"""
Pydantic schemas for Edge Data Synchronization and Offline-First Batches.
Enables peripheral health centers, outreach posts, and wards in Southwestern Ethiopia
to function completely offline and sync with Mettu Karl central DB upon reconnection.
"""
from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.patient import Gender


class OfflinePatientItem(BaseModel):
    temp_id: str = Field(..., description="Client-generated unique ID, e.g. 'TEMP-PAT-001'")
    mrn: Optional[str] = Field(None, description="Offline MRN if pre-allocated")
    first_name: str
    last_name: str
    birth_date: date
    gender: Gender
    phone_number: Optional[str] = None
    kebele: Optional[str] = None
    woreda: Optional[str] = "Mettu"
    created_offline_at: datetime


class OfflineObservationItem(BaseModel):
    temp_id: str
    patient_mrn: str
    vital_type: str  # heart_rate, bp_systolic, bp_diastolic, spo2, temperature, clinical_note
    value: str
    unit: Optional[str] = None
    recorded_offline_at: datetime


class OfflinePrescriptionItem(BaseModel):
    temp_id: str
    patient_mrn: str
    medications: List[Dict[str, Any]]
    prescribed_offline_at: datetime


class EdgeSyncBatchRequest(BaseModel):
    station_id: str = Field("CLINIC-HURUMU-01", description="Peripheral clinic or outreach identifier")
    station_name: str = Field("Hurumu Health Post", description="Facility name")
    patients: List[OfflinePatientItem] = Field(default_factory=list)
    observations: List[OfflineObservationItem] = Field(default_factory=list)
    prescriptions: List[OfflinePrescriptionItem] = Field(default_factory=list)
    batch_timestamp: datetime


class SyncResolutionItem(BaseModel):
    temp_id: str
    permanent_id: int
    entity_type: str
    status: Literal["RESOLVED_INSERTED", "RESOLVED_MERGED", "RESOLVED_CONFLICT_SERVER_WIN"]
    message: str


class EdgeSyncBatchResponse(BaseModel):
    batch_id: str
    station_id: str
    synced_at: datetime
    patients_processed: int
    observations_processed: int
    prescriptions_processed: int
    resolutions: List[SyncResolutionItem]

    model_config = ConfigDict(from_attributes=True)


class SyncStatusResponse(BaseModel):
    status: str = "operational"
    server_time: datetime
    conflict_resolution_strategy: str = "last_write_wins_with_patient_merge"
    active_edge_stations_count: int = 14
