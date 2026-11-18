"""
Pydantic schemas for Executive BI Dashboard metrics and hospital performance KPIs.
"""
from typing import List
from pydantic import BaseModel


class RevenueMetric(BaseModel):
    category: str
    total_birr: float
    percentage: float


class DepartmentWorkload(BaseModel):
    department: str
    patient_count: int


class WardOccupancyMetric(BaseModel):
    ward_code: str
    ward_name: str
    total_beds: int
    occupied_beds: int
    occupancy_percent: float


class ExecutiveSummaryResponse(BaseModel):
    time_range: str = "today"
    generated_at: str = ""
    total_patients_registered: int
    new_patients_in_period: int = 0
    patient_growth_percent: float = 0.0
    outpatients_today: int
    active_inpatient_admissions: int
    total_beds: int = 0
    occupied_beds: int = 0
    available_beds: int = 0
    bed_occupancy_rate_percent: float
    daily_gross_revenue_etb: float
    telebirr_collection_etb: float
    cash_collection_etb: float
    cbhi_claims_etb: float
    revenue_breakdown: List[RevenueMetric]
    outpatient_triage_distribution: List[DepartmentWorkload]
    ward_occupancy_breakdown: List[WardOccupancyMetric] = []
    pharmacy_low_stock_count: int
    pharmacy_expiring_soon_count: int
    emergency_admissions_in_period: int = 0
    ot_surgeries_total: int = 0
    ot_surgeries_completed: int = 0
    lab_orders_total: int = 0
    lab_orders_completed: int = 0
    average_length_of_stay_days: float = 0.0
    bed_turnover_rate: float = 0.0
    hai_cases_count: int = 0
    surgical_site_infection_rate_percent: float = 0.0
    moh_safety_index_score: float = 100.0
