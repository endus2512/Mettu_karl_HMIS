"""
Pydantic schemas for HRM, Shift Roster, and Ethiopian Payroll Management.
"""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.hrm import EmploymentType, LeaveStatus, LeaveType, ShiftType


class EmployeeCreate(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    phone_number: str
    email: EmailStr
    department: str
    designation: str
    employment_type: EmploymentType = EmploymentType.PERMANENT
    hire_date: date
    medical_license_number: Optional[str] = None
    license_expiry_date: Optional[date] = None
    base_salary_etb: float = Field(..., gt=0.0)


class EmployeeResponse(EmployeeCreate):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


class ShiftRosterCreate(BaseModel):
    employee_id: int
    shift_date: date
    shift_type: ShiftType
    ward_or_clinic: str


class ShiftRosterResponse(ShiftRosterCreate):
    id: int
    is_on_duty: bool

    model_config = {"from_attributes": True}


class AttendanceClockIn(BaseModel):
    employee_id: int
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    attendance_date: date
    clock_in: datetime
    clock_out: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class PayrollCalculationRequest(BaseModel):
    employee_id: int
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)
    duty_allowance_etb: float = Field(default=0.0, ge=0.0)
    overtime_etb: float = Field(default=0.0, ge=0.0)


class PayrollSlipResponse(BaseModel):
    id: int
    employee_id: int
    month: int
    year: int
    base_salary_etb: float
    duty_allowance_etb: float
    overtime_etb: float
    gross_salary_etb: float
    employee_pension_etb: float
    employer_pension_etb: float
    income_tax_etb: float
    total_deductions_etb: float
    net_pay_etb: float
    created_at: datetime

    model_config = {"from_attributes": True}
