"""
HRM, Staff Roster, Attendance, and Ethiopian Payroll endpoints.
"""
from datetime import date, datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_user, require_roles
from app.core.audit import record_audit_event
from app.core.database import get_db
from app.models.hrm import (
    Attendance,
    Employee,
    PayrollSlip,
    ShiftRoster,
)
from app.models.user import User, UserRole
from app.schemas.hrm import (
    AttendanceClockIn,
    AttendanceResponse,
    EmployeeCreate,
    EmployeeResponse,
    PayrollCalculationRequest,
    PayrollSlipResponse,
    ShiftRosterCreate,
    ShiftRosterResponse,
)
from app.services.payroll_service import process_employee_payroll

router = APIRouter()

admin_guard = require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)


@router.get("/employees", response_model=List[EmployeeResponse], summary="List Hospital Employees")
async def list_employees(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_guard)],
    department: Optional[str] = None,
) -> List[Employee]:
    """Retrieve hospital staff records with optional department filter."""
    query = select(Employee).where(Employee.is_active.is_(True))
    if department:
        query = query.where(Employee.department == department)
    res = await db.execute(query)
    return list(res.scalars().all())


@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED, summary="Register Employee")
async def create_employee(
    emp_in: EmployeeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_guard)],
) -> Employee:
    """Create a new staff employee record."""
    emp = Employee(**emp_in.model_dump())
    db.add(emp)
    await db.commit()
    await db.refresh(emp)
    return emp


@router.post("/shifts", response_model=ShiftRosterResponse, status_code=status.HTTP_201_CREATED, summary="Schedule Staff Shift")
async def schedule_shift(
    shift_in: ShiftRosterCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ShiftRoster:
    """Schedule duty shift for physician, nurse, or clinical staff."""
    shift = ShiftRoster(**shift_in.model_dump())
    db.add(shift)
    await db.commit()
    await db.refresh(shift)
    return shift


@router.post("/attendance/clock-in", response_model=AttendanceResponse, summary="Record Staff Clock-In")
async def clock_in(
    att_in: AttendanceClockIn,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Attendance:
    """Record employee daily duty arrival time."""
    now = datetime.now(timezone.utc)
    att = Attendance(
        employee_id=att_in.employee_id,
        attendance_date=now.date(),
        clock_in=now,
        notes=att_in.notes,
    )
    db.add(att)
    await db.commit()
    await db.refresh(att)
    return att


@router.post("/payroll/calculate", response_model=PayrollSlipResponse, summary="Compute Ethiopian Payroll Slip")
async def calculate_payroll(
    pay_req: PayrollCalculationRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_guard)],
) -> PayrollSlip:
    """
    Generate employee monthly payslip with statutory 7% pension and Ethiopian progressive income tax.
    """
    try:
        slip = await process_employee_payroll(
            db,
            employee_id=pay_req.employee_id,
            month=pay_req.month,
            year=pay_req.year,
            duty_allowance_etb=pay_req.duty_allowance_etb,
            overtime_etb=pay_req.overtime_etb,
        )

        await record_audit_event(
            db,
            user_id=current_user.id,
            action="PAYROLL_CALCULATE",
            resource="PayrollSlip",
            resource_id=f"EMP-{slip.employee_id}-{slip.month}/{slip.year}",
            ip_address=get_client_ip(request),
            result="success",
            detail={"gross": slip.gross_salary_etb, "net": slip.net_pay_etb},
        )
        return slip
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
