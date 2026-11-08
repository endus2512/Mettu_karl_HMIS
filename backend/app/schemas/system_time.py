"""
Pydantic schemas for Hospital Online Time, Calendar, and Shift Management.
"""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.hrm import ShiftType


class GregorianDateInfo(BaseModel):
    date: str
    year: int
    month: int
    day: int
    day_of_week: str
    formatted: str


class EthiopianDateInfo(BaseModel):
    year: int
    month_number: int
    month_name_om: str
    month_name_am: str
    month_name_en: str
    day: int
    habasha_time_str: str
    formatted_om: str
    formatted_am: str
    formatted_en: str


class ShiftInfo(BaseModel):
    type: ShiftType
    name_om: str
    name_am: str
    name_en: str
    start_time: str
    end_time: str
    progress_percent: float
    handover_countdown_minutes: int
    charge_nurse: str
    duty_physician: str
    handover_notes: Optional[str] = None
    is_auto: bool
    last_switched_at: str


class TimeSyncResponse(BaseModel):
    server_timestamp_iso: str
    server_time: str
    server_date: str
    timezone: str
    ntp_synced: bool
    gregorian: GregorianDateInfo
    ethiopian: EthiopianDateInfo
    shift: ShiftInfo


class ShiftOverrideRequest(BaseModel):
    shift_type: ShiftType
    charge_nurse: Optional[str] = None
    duty_physician: Optional[str] = None
    handover_notes: Optional[str] = None
    is_auto: Optional[bool] = False
    custom_eth_month: Optional[str] = None
    custom_eth_day: Optional[int] = None
    custom_eth_year: Optional[int] = None


class WardRosterMember(BaseModel):
    name: str
    role: str
    ward: str
    shift_type: str
    phone: str
    status: str


class ShiftRosterOverviewResponse(BaseModel):
    date: str
    active_shift: ShiftType
    on_duty_staff_count: int
    roster: List[WardRosterMember]
