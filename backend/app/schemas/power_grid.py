"""
Pydantic schemas for Hospital Physical Resilience, Grid, Dual Generators & Solar Microgrid.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.power_grid import ATSState, PowerSourceType


class PowerTelemetryCreate(BaseModel):
    active_source: PowerSourceType = PowerSourceType.EEU_GRID
    eeu_grid_online: bool = True
    eeu_grid_voltage: float = 380.0
    gen1_running: bool = False
    gen1_fuel_percent: float = Field(85.0, ge=0.0, le=100.0)
    gen2_running: bool = False
    gen2_fuel_percent: float = Field(92.0, ge=0.0, le=100.0)
    ats_state: ATSState = ATSState.MAIN_GRID_ENGAGED
    solar_battery_soc_percent: float = Field(94.0, ge=0.0, le=100.0)
    total_hospital_load_kw: float = Field(145.0, ge=0.0)
    server_room_ups_soc_percent: float = Field(100.0, ge=0.0, le=100.0)
    cold_chain_alarm: bool = False


class PowerTelemetryResponse(PowerTelemetryCreate):
    id: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class PowerGridSummary(BaseModel):
    current_source: PowerSourceType
    eeu_grid_status: str # "Online - 380V Stable" or "Blackout / Disconnected"
    diesel_reserves_sufficient: bool # True if Gen1 and Gen2 fuel > 25%
    solar_battery_soc_percent: float
    ats_state: ATSState
    critical_care_power_secure: bool
    active_power_alert: Optional[str] = None
