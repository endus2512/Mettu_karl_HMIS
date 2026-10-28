"""
Hospital Physical Resilience: Power Grid, Generator & Solar Monitoring service.
Monitors main EEU utility, fuel levels, automatic transfer switch (ATS), and solar microgrid.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.power_grid import ATSState, HospitalPowerTelemetry, PowerSourceType
from app.schemas.power_grid import PowerGridSummary


def evaluate_power_grid_state(telemetry: HospitalPowerTelemetry) -> PowerGridSummary:
    """Analyze real-time power telemetry and flag resilience risks."""
    fuel_sufficient = (telemetry.gen1_fuel_percent >= 25.0) and (telemetry.gen2_fuel_percent >= 25.0)
    
    grid_status = (
        f"Online - {telemetry.eeu_grid_voltage:.1f}V Stable"
        if telemetry.eeu_grid_online
        else "Blackout / Disconnected"
    )

    alert: Optional[str] = None
    if not telemetry.eeu_grid_online:
        if telemetry.ats_state != ATSState.GENERATOR_ENGAGED:
            alert = "CRITICAL: EEU Grid failed but ATS did not engage backup generator!"
        elif not fuel_sufficient:
            alert = "WARNING: Backup diesel generator fuel is below 25% reserve threshold!"
        else:
            alert = "INFO: Running on backup diesel generation; main grid offline."
    elif telemetry.cold_chain_alarm:
        alert = "CRITICAL: Cold chain power fault detected in Blood Bank / Vaccine storage!"

    critical_secure = (
        telemetry.server_room_ups_soc_percent > 30.0
        and not telemetry.cold_chain_alarm
        and (telemetry.eeu_grid_online or telemetry.gen1_running or telemetry.gen2_running)
    )

    return PowerGridSummary(
        current_source=telemetry.active_source,
        eeu_grid_status=grid_status,
        diesel_reserves_sufficient=fuel_sufficient,
        solar_battery_soc_percent=telemetry.solar_battery_soc_percent,
        ats_state=telemetry.ats_state,
        critical_care_power_secure=critical_secure,
        active_power_alert=alert,
    )
