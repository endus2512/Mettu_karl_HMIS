"""
Pydantic schemas for Executive BI Dashboard metrics and hospital performance KPIs.
"""
from typing import Dict, List
from pydantic import BaseModel


class RevenueMetric(BaseModel):
    category: str
    total_birr: float
    percentage: float


class DepartmentWorkload(BaseModel):
    department: str
    patient_count: int


class ExecutiveSummaryResponse(BaseModel):
    total_patients_registered: int
    outpatients_today: int
    active_inpatient_admissions: int
    bed_occupancy_rate_percent: float
    daily_gross_revenue_etb: float
    telebirr_collection_etb: float
    cash_collection_etb: float
    cbhi_claims_etb: float
    revenue_breakdown: List[RevenueMetric]
    outpatient_triage_distribution: List[DepartmentWorkload]
    pharmacy_low_stock_count: int
    pharmacy_expiring_soon_count: int
