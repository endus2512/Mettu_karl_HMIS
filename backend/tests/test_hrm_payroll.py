"""
Tests for HRM, Shift Scheduling, and Ethiopian Progressive Payroll (Proclamation 979/2016).
"""
from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hrm import Employee, EmploymentType
from app.services.payroll_service import calculate_ethiopian_income_tax


def test_ethiopian_tax_brackets():
    """Verify standard Ethiopian progressive income tax calculation."""
    # Under 600 ETB = 0%
    assert calculate_ethiopian_income_tax(500) == 0.0
    # 1000 ETB (10% - 60) = 40 ETB
    assert calculate_ethiopian_income_tax(1000) == 40.0
    # 3000 ETB (15% - 142.50) = 307.50 ETB
    assert calculate_ethiopian_income_tax(3000) == 307.50
    # 5000 ETB (20% - 302.50) = 697.50 ETB
    assert calculate_ethiopian_income_tax(5000) == 697.50
    # 12000 ETB (35% - 1500) = 2700.00 ETB
    assert calculate_ethiopian_income_tax(12000) == 2700.00


@pytest.mark.asyncio
async def test_payroll_slip_generation(client: AsyncClient, doctor_auth_headers: dict[str, str], db_session: AsyncSession):
    """Test full payslip calculation with pension, income tax, and net pay."""
    emp = Employee(
        employee_code="EMP-TEST-01",
        first_name="Chaltu",
        last_name="Gudeta",
        phone_number="+251911223344",
        email="chaltu.nurse@mettukarl.gov.et",
        department="Inpatient Ward 3",
        designation="Senior Nurse",
        employment_type=EmploymentType.PERMANENT,
        hire_date=date(2022, 1, 1),
        base_salary_etb=10000.0,
    )
    db_session.add(emp)
    await db_session.commit()

    payroll_payload = {
        "employee_id": emp.id,
        "month": 10,
        "year": 2026,
        "duty_allowance_etb": 2000.0,
        "overtime_etb": 0.0,
    }

    res = await client.post("/api/v1/hrm/payroll/calculate", json=payroll_payload, headers=doctor_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["base_salary_etb"] == 10000.0
    assert data["gross_salary_etb"] == 12000.0
    assert data["employee_pension_etb"] == 700.0   # 7% of 10,000 base
    assert data["employer_pension_etb"] == 1100.0  # 11% of 10,000 base
    assert data["income_tax_etb"] == 2700.0        # Tax on 12,000 gross
    assert data["total_deductions_etb"] == 3400.0  # 700 + 2700
    assert data["net_pay_etb"] == 8600.0           # 12000 - 3400
