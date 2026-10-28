"""
Pydantic schemas for authentication, token generation, and MFA.
"""
from datetime import datetime
from typing import Optional

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
    is_active: bool
    is_mfa_enabled: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
