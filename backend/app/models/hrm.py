"""
Human Resource Management (HRM), Shift Roster, and Payroll ORM models.
Implements Ethiopian Labour & Tax Proclamation No. 979/2016 specifications.
"""
from datetime import date, datetime, time, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EmploymentType(str, enum.Enum):
    PERMANENT = "permanent"
    CONTRACT = "contract"
    INTERN = "intern"
    RESIDENT = "resident"


class ShiftType(str, enum.Enum):
    MORNING = "morning"       # 08:00 - 16:00
    AFTERNOON = "afternoon"   # 16:00 - 23:00
    NIGHT = "night"           # 23:00 - 08:00
    ON_CALL = "on_call"       # 24-hr clinical standby


class LeaveType(str, enum.Enum):
    ANNUAL = "annual"
    SICK = "sick"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    BEREAVEMENT = "bereavement"
    STUDY = "study"


class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Employee(Base):
    """Hospital staff profile linked to internal user and HR records."""
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    department: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    employment_type: Mapped[EmploymentType] = mapped_column(
        Enum(EmploymentType, name="employment_type_enum", native_enum=False),
        default=EmploymentType.PERMANENT,
        nullable=False,
    )
    hire_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Professional license & credentials
    medical_license_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    license_expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Payroll base (in ETB)
    base_salary_etb: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    shifts: Mapped[list["ShiftRoster"]] = relationship("ShiftRoster", back_populates="employee")
    attendances: Mapped[list["Attendance"]] = relationship("Attendance", back_populates="employee")
    payrolls: Mapped[list["PayrollSlip"]] = relationship("PayrollSlip", back_populates="employee")


class ShiftRoster(Base):
    """Clinical duty roster and shift scheduling."""
    __tablename__ = "shift_rosters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    shift_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    shift_type: Mapped[ShiftType] = mapped_column(
        Enum(ShiftType, name="shift_type_enum", native_enum=False),
        nullable=False,
    )
    ward_or_clinic: Mapped[str] = mapped_column(String(100), nullable=False)
    is_on_duty: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="shifts")


class Attendance(Base):
    """Daily staff clock-in/out attendance logging."""
    __tablename__ = "attendances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    attendance_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    clock_in: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    clock_out: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="attendances")


class LeaveRequest(Base):
    """Employee formal leave request."""
    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    leave_type: Mapped[LeaveType] = mapped_column(
        Enum(LeaveType, name="leave_type_enum", native_enum=False),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[LeaveStatus] = mapped_column(
        Enum(LeaveStatus, name="leave_status_enum", native_enum=False),
        default=LeaveStatus.PENDING,
        nullable=False,
    )
    approved_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class PayrollSlip(Base):
    """Monthly payroll statement computed per Ethiopian Tax & Pension Proclamation."""
    __tablename__ = "payroll_slips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    month: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 12
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    base_salary_etb: Mapped[float] = mapped_column(Float, nullable=False)
    duty_allowance_etb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    overtime_etb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    gross_salary_etb: Mapped[float] = mapped_column(Float, nullable=False)

    # Statutory Deductions
    employee_pension_etb: Mapped[float] = mapped_column(Float, nullable=False)  # 7%
    employer_pension_etb: Mapped[float] = mapped_column(Float, nullable=False)  # 11%
    income_tax_etb: Mapped[float] = mapped_column(Float, nullable=False)        # Progressive brackets
    total_deductions_etb: Mapped[float] = mapped_column(Float, nullable=False)

    net_pay_etb: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    employee: Mapped["Employee"] = relationship("Employee", back_populates="payrolls")
