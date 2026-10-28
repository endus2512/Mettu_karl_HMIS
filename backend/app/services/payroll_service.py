"""
Ethiopian Payroll Calculation Service based on Proclamation No. 979/2016.

Calculates:
- 7% Employee Pension Contribution
- 11% Employer Pension Contribution
- Progressive Employment Income Tax:
    0 - 600 ETB: 0%
    601 - 1,650 ETB: 10% (deduction 60)
    1,651 - 3,200 ETB: 15% (deduction 142.50)
    3,201 - 5,250 ETB: 20% (deduction 302.50)
    5,251 - 7,800 ETB: 25% (deduction 565.00)
    7,801 - 10,900 ETB: 30% (deduction 955.00)
    > 10,900 ETB: 35% (deduction 1,500.00)
"""
from typing import Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hrm import Employee, PayrollSlip


def calculate_ethiopian_income_tax(taxable_income: float) -> float:
    """Calculate progressive income tax per Ethiopian tax schedule."""
    if taxable_income <= 600:
        return 0.0
    elif taxable_income <= 1650:
        return (taxable_income * 0.10) - 60.0
    elif taxable_income <= 3200:
        return (taxable_income * 0.15) - 142.50
    elif taxable_income <= 5250:
        return (taxable_income * 0.20) - 302.50
    elif taxable_income <= 7800:
        return (taxable_income * 0.25) - 565.00
    elif taxable_income <= 10900:
        return (taxable_income * 0.30) - 955.00
    else:
        return (taxable_income * 0.35) - 1500.00


async def process_employee_payroll(
    db: AsyncSession,
    employee_id: int,
    month: int,
    year: int,
    duty_allowance_etb: float = 0.0,
    overtime_etb: float = 0.0,
) -> PayrollSlip:
    """
    Generate official monthly payslip for hospital employee.
    Computes statutory pension, income tax, and net payable.
    """
    stmt = select(Employee).where(Employee.id == employee_id)
    res = await db.execute(stmt)
    employee = res.scalar_one_or_none()

    if not employee:
        raise ValueError(f"Employee with ID {employee_id} not found")

    base = employee.base_salary_etb
    gross = base + duty_allowance_etb + overtime_etb

    # Statutory Pension
    employee_pension = round(base * 0.07, 2)  # 7% on basic salary
    employer_pension = round(base * 0.11, 2)  # 11% on basic salary

    # Income Tax on taxable gross
    income_tax = round(calculate_ethiopian_income_tax(gross), 2)
    total_deductions = round(employee_pension + income_tax, 2)
    net_pay = round(gross - total_deductions, 2)

    payslip = PayrollSlip(
        employee_id=employee.id,
        month=month,
        year=year,
        base_salary_etb=base,
        duty_allowance_etb=duty_allowance_etb,
        overtime_etb=overtime_etb,
        gross_salary_etb=gross,
        employee_pension_etb=employee_pension,
        employer_pension_etb=employer_pension,
        income_tax_etb=income_tax,
        total_deductions_etb=total_deductions,
        net_pay_etb=net_pay,
    )

    db.add(payslip)
    await db.commit()
    await db.refresh(payslip)
    return payslip
