"""
User ORM model for authentication and role-based access control.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserRole(str, enum.Enum):
    """System roles defining user permissions."""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    PHARMACIST = "pharmacist"
    INSURANCE_OFFICER = "insurance_officer"
    TECHNICIAN = "technician"
    PATIENT = "patient"
    LAB_TECH = "lab_tech"
    RECEPTIONIST = "receptionist"
    BILLING = "billing"


class ApprovalStatus(str, enum.Enum):
    """Enrollment verification states for hospital staff accounts."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(Base):
    """User account entity with security lockout, approval workflow, and MFA fields."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum", native_enum=False),
        default=UserRole.RECEPTIONIST,
        nullable=False,
    )

    # Staff enrollment & credential verification fields
    staff_id: Mapped[Optional[str]] = mapped_column(String(64), unique=True, index=True, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    license_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    approval_status: Mapped[str] = mapped_column(String(20), default="approved", index=True, nullable=False)
    requested_role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    risk_flag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    approved_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    requested_ip: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Patient Portal linkage
    patient_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fayda_id: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), index=True, nullable=True)

    # Status & Lockout
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Multi-Factor Authentication
    is_mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mfa_secret: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Audit & timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
