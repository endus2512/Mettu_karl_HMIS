"""
Hospital Physical Resilience: Grid, Dual Diesel Generators & Solar Microgrid ORM models.
Provides continuous monitoring of power continuity, fuel reserves, and automated transfer switch (ATS) events.
"""
from datetime import datetime, timezone
import enum

from sqlalchemy import Boolean, DateTime, Enum, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PowerSourceType(str, enum.Enum):
    EEU_GRID = "eeu_grid" # Ethiopian Electric Utility 33kV Line
    DIESEL_GENERATOR_1 = "diesel_generator_1" # Primary 500kVA Cummins Unit
    DIESEL_GENERATOR_2 = "diesel_generator_2" # Standby 500kVA Unit
    SOLAR_PV_BATTERY = "solar_pv_battery" # Rooftop Solar Microgrid


class ATSState(str, enum.Enum):
    MAIN_GRID_ENGAGED = "main_grid_engaged"
    GENERATOR_ENGAGED = "generator_engaged"
    ISOLATED_SOLAR = "isolated_solar"


class HospitalPowerTelemetry(Base):
    """High-frequency power telemetry datapoint for hospital facilities and critical care units."""
    __tablename__ = "hospital_power_telemetries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )
    
    active_source: Mapped[PowerSourceType] = mapped_column(
        Enum(PowerSourceType, name="power_source_enum", native_enum=False),
        default=PowerSourceType.EEU_GRID,
        nullable=False,
    )
    eeu_grid_online: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    eeu_grid_voltage: Mapped[float] = mapped_column(Float, default=380.0, nullable=False) # 3-phase nominal 380V/220V
    
    # Dual Diesel Generators Status
    gen1_running: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gen1_fuel_percent: Mapped[float] = mapped_column(Float, default=85.0, nullable=False) # Critical if < 25%
    gen2_running: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gen2_fuel_percent: Mapped[float] = mapped_column(Float, default=92.0, nullable=False)
    
    ats_state: Mapped[ATSState] = mapped_column(
        Enum(ATSState, name="ats_state_enum", native_enum=False),
        default=ATSState.MAIN_GRID_ENGAGED,
        nullable=False,
    )
    
    # Solar PV Microgrid & Critical Battery Storage
    solar_battery_soc_percent: Mapped[float] = mapped_column(Float, default=94.0, nullable=False) # State of Charge
    total_hospital_load_kw: Mapped[float] = mapped_column(Float, default=145.0, nullable=False)
    server_room_ups_soc_percent: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    cold_chain_alarm: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
