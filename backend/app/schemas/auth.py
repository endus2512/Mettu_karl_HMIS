"""
Pydantic schemas for authentication, token generation, and MFA.
"""
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class LoginRequest(BaseModel):
    """Initial login payload with username and password."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class MFALoginRequest(BaseModel):
    """MFA verification payload for step-2 authentication."""
    temp_token: str
    totp_code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")


class PatientLoginRequest(BaseModel):
    """Payload for dedicated patient login via Fayda Digital ID or Phone Number."""
    identifier: str = Field(..., min_length=3, description="Fayda FAN/FIN or Phone number")
    password_or_otp: str = Field(..., min_length=4, description="Password or 6-digit SMS OTP")


class PatientRegisterRequest(BaseModel):
    """Payload for patient self-registration in Patient Portal."""
    full_name: str = Field(..., min_length=3, max_length=150, description="Full Name of the Patient")
    phone_number: str = Field(..., min_length=7, max_length=20, description="Mobile Phone Number")
    fayda_id: Optional[str] = Field(None, max_length=50, description="Fayda National ID (FAN/FIN)")
    birth_place: Optional[str] = Field(None, max_length=100, description="Place of Birth or Woreda/Kebele")
    birth_date: Optional[str] = Field(None, max_length=20, description="Date of birth YYYY-MM-DD")
    gender: Optional[str] = Field("male", max_length=10, description="Administrative gender")
    password: str = Field(..., min_length=4, max_length=100, description="Password or PIN")


class TokenResponse(BaseModel):
    """JWT bearer token response."""
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    requires_mfa: bool = False
    temp_token: Optional[str] = None
    role: Optional[UserRole] = None
    username: Optional[str] = None
    user_id: Optional[int] = None
    full_name: Optional[str] = None
    patient_id: Optional[int] = None
    mrn: Optional[str] = None
    fhir_id: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """Refresh token submission payload."""
    refresh_token: str


class MFASetupResponse(BaseModel):
    """MFA setup response containing TOTP secret and provisioning URI."""
    secret: str
    provisioning_uri: str


class MFAVerifyRequest(BaseModel):
    """Code submission to verify and enable MFA on user account."""
    totp_code: str = Field(..., min_length=6, max_length=6)


class UserCreate(BaseModel):
    """User account creation schema."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.RECEPTIONIST


class UserResponse(BaseModel):
    """User profile response schema."""
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    staff_id: Optional[str] = None
    department: Optional[str] = None
    license_number: Optional[str] = None
    approval_status: str = "approved"
    requested_role: Optional[str] = None
    risk_flag: Optional[str] = None
    is_active: bool
    is_mfa_enabled: bool
    created_at: datetime
    first_login_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    last_ip: Optional[str] = None
    last_activity_path: Optional[str] = None

    model_config = {"from_attributes": True}


class StaffRegisterRequest(BaseModel):
    """Public staff self-registration request routed to Admin verification queue."""
    full_name: str = Field(..., min_length=2, max_length=255)
    staff_id: str = Field(..., min_length=3, max_length=64)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, max_length=20)
    department: str = Field(..., min_length=2, max_length=100)
    requested_role: str = Field(..., min_length=2, max_length=50)
    license_number: Optional[str] = Field(None, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)


class StaffRegistrationResponse(BaseModel):
    """Confirmation payload returned without auth tokens while pending Admin review."""
    id: int
    username: str
    staff_id: str
    full_name: str
    requested_role: str
    department: str
    approval_status: str
    risk_flag: Optional[str] = None
    message: str


class PendingStaffUserResponse(BaseModel):
    """Admin oversight view of self-registered staff enrollment requests."""
    id: int
    username: str
    email: str
    full_name: str
    staff_id: Optional[str] = None
    department: Optional[str] = None
    license_number: Optional[str] = None
    phone_number: Optional[str] = None
    role: UserRole
    requested_role: Optional[str] = None
    approval_status: str
    risk_flag: Optional[str] = None
    rejection_reason: Optional[str] = None
    requested_ip: Optional[str] = None
    is_active: bool
    created_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    first_login_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    last_ip: Optional[str] = None
    last_activity_path: Optional[str] = None

    model_config = {"from_attributes": True}


class StaffApprovalDecisionRequest(BaseModel):
    """Admin payload for approving or rejecting a pending staff enrollment request."""
    assigned_role: Optional[UserRole] = None
    rejection_reason: Optional[str] = Field(None, max_length=255)


class StaffHeartbeatRequest(BaseModel):
    """Lightweight activity pulse from authenticated staff browser sessions."""
    current_path: Optional[str] = Field(None, max_length=255)


class StaffWorkforceItemResponse(BaseModel):
    """Live Admin monitoring snapshot for an individual hospital staff member."""
    id: int
    username: str
    email: str
    full_name: str
    staff_id: Optional[str] = None
    department: Optional[str] = None
    license_number: Optional[str] = None
    phone_number: Optional[str] = None
    role: UserRole
    requested_role: Optional[str] = None
    approval_status: str
    risk_flag: Optional[str] = None
    rejection_reason: Optional[str] = None
    is_active: bool
    created_at: datetime
    first_login_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    last_ip: Optional[str] = None
    last_activity_path: Optional[str] = None
    work_status: str
    idle_seconds: Optional[int] = None

    model_config = {"from_attributes": True}


class StaffWorkforceSummaryResponse(BaseModel):
    """Real-time hospital staff working status & access control summary."""
    total_staff: int
    working_now_count: int
    recent_count: int
    offline_count: int
    blocked_count: int
    pending_count: int
    items: List[StaffWorkforceItemResponse]


class StaffWorkforceControlRequest(BaseModel):
    """Admin payload to block, activate, or reassign role/permissions for any staff member."""
    action: Literal["block", "activate", "update_role"]
    assigned_role: Optional[UserRole] = None
    reason: Optional[str] = Field(None, max_length=255)


class AdminSecurityAlarmResponse(BaseModel):
    """Real-time Admin security alarm enriched with current target account status."""
    id: int
    title: str
    message: str
    severity: str
    category: str
    event_type: str
    actor_name: str
    actor_role: str
    actor_user_id: Optional[int] = None
    staff_id: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    requested_role: Optional[str] = None
    department: Optional[str] = None
    license_number: Optional[str] = None
    ip_address: Optional[str] = None
    risk_flag: Optional[str] = None
    user_approval_status: Optional[str] = None
    user_is_active: Optional[bool] = None
    user_current_role: Optional[str] = None
    is_read: bool
    created_at: datetime
    reacted_at: Optional[datetime] = None
    reaction_by: Optional[str] = None
