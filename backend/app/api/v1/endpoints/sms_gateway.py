"""
SMS Gateway, USSD Telco Session, and Carrier Provider Management Endpoints.
Integrates Ethio Telecom Bulk SMS, Twilio Global SMS, Android GSM SIM Gateway, and *907# USSD workflows.
"""
from datetime import datetime, timezone
import os
from typing import Annotated, List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin, require_roles, require_staff
from app.core.database import get_db
from app.models.notification import SMSNotificationLog, NotificationStatus, SMSGatewayConfig
from app.models.user import User, UserRole
from app.services.sms_service import sms_service, TEMPLATES, format_ethiopian_phone

router = APIRouter()

sms_dispatch_guard = require_roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
)


class SMSDispatchRequest(BaseModel):
    phone_number: str = Field(..., description="Mobile phone number (+2519... or 09...)")
    template_key: Optional[str] = Field(None, description="Template key: queue_alert, appointment_reminder, prescription_ready, payment_receipt, emergency_alert")
    custom_message: Optional[str] = Field(None, description="Raw custom message if template_key is omitted")
    language: str = Field("om", description="Language code: om (Afaan Oromoo), am (Amharic), en (English)")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Template placeholder replacements")


class SMSDispatchResponse(BaseModel):
    id: int
    recipient_phone: str
    message_text: str
    language: str
    status: str
    channel: str
    sent_at: Optional[str] = None
    carrier_note: Optional[str] = None
    is_carrier_delivered: bool = False
    error_message: Optional[str] = None


class USSDSessionRequest(BaseModel):
    session_id: str = Field("MKH-USSD-001", description="Telecom session ID")
    phone_number: str = Field("+251911002233", description="Patient mobile phone number")
    service_code: str = Field("*907#", description="Shortcode e.g. *907# or *804#")
    text: str = Field("", description="Input sequence, e.g. '' on initial dial, '1', '1*2', etc.")
    language: str = Field("om", description="Session language preference")


class USSDSessionResponse(BaseModel):
    session_id: str
    response: str
    action: str  # "CON" (continue) or "END" (session complete)


class SMSGatewayConfigPayload(BaseModel):
    provider: str = Field("twilio", description="Provider: twilio, ethio_telecom, android_gateway, africastalking, simulated")
    is_active: bool = True

    # Twilio
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_from_number: Optional[str] = None

    # Ethio Telecom
    ethio_url: Optional[str] = None
    ethio_username: Optional[str] = None
    ethio_password: Optional[str] = None
    ethio_shortcode: Optional[str] = "907"

    # Android GSM Gateway
    android_gateway_url: Optional[str] = None
    android_gateway_token: Optional[str] = None

    # Africa's Talking
    africastalking_username: Optional[str] = None
    africastalking_api_key: Optional[str] = None
    africastalking_sender_id: Optional[str] = None


class SMSGatewayConfigResponse(BaseModel):
    provider: str
    is_active: bool
    is_configured: bool
    status_summary: str
    twilio_account_sid_masked: Optional[str] = None
    twilio_from_number: Optional[str] = None
    ethio_url: Optional[str] = None
    ethio_shortcode: Optional[str] = None
    android_gateway_url: Optional[str] = None


class TestSMSConnectionRequest(BaseModel):
    phone_number: str = Field(..., description="Target mobile phone to receive real test SMS")
    message: Optional[str] = "Mettu Karl Hospital: Testing Live SMS Gateway Connection. *907#"


class TestSMSConnectionResponse(BaseModel):
    success: bool
    phone_number: str
    provider_used: str
    carrier_message: str
    dispatch_log_id: Optional[int] = None


def _mask(s: Optional[str]) -> Optional[str]:
    if not s or len(s) < 8:
        return "****" if s else None
    return f"{s[:4]}...{s[-4:]}"


async def _build_gateway_config_response(db: AsyncSession) -> SMSGatewayConfigResponse:
    """Build masked active SMS carrier configuration response."""
    stmt = select(SMSGatewayConfig).where(SMSGatewayConfig.is_active == True).order_by(desc(SMSGatewayConfig.id))
    res = await db.execute(stmt)
    cfg = res.scalar_one_or_none()

    provider = cfg.provider if cfg else "simulated"
    is_active = cfg.is_active if cfg else False

    tw_sid = (cfg.twilio_account_sid if cfg else None) or os.getenv("TWILIO_ACCOUNT_SID")
    tw_token = (cfg.twilio_auth_token if cfg else None) or os.getenv("TWILIO_AUTH_TOKEN")
    eth_url = (cfg.ethio_url if cfg else None) or os.getenv("ETHIO_TELECOM_SMS_URL")
    android_url = (cfg.android_gateway_url if cfg else None) or os.getenv("ANDROID_GSM_GATEWAY_URL")

    is_configured = bool((tw_sid and tw_token) or eth_url or android_url)

    if tw_sid and tw_token:
        summary = "Twilio Global Gateway Configured & Ready"
    elif eth_url:
        summary = "Ethio Telecom REST Gateway Configured & Ready"
    elif android_url:
        summary = "Android Phone SIM Gateway Configured & Ready"
    else:
        summary = "Simulation / Internal Audit Mode (No live cellular credentials configured)"

    return SMSGatewayConfigResponse(
        provider=provider,
        is_active=is_active or is_configured,
        is_configured=is_configured,
        status_summary=summary,
        twilio_account_sid_masked=_mask(tw_sid),
        twilio_from_number=(cfg.twilio_from_number if cfg else None) or os.getenv("TWILIO_FROM_NUMBER"),
        ethio_url=eth_url,
        ethio_shortcode=(cfg.ethio_shortcode if cfg else None) or os.getenv("ETHIO_TELECOM_SHORTCODE", "907"),
        android_gateway_url=android_url,
    )


@router.get("/config", response_model=SMSGatewayConfigResponse, summary="Get Active SMS Gateway Configuration")
async def get_gateway_config(
    current_user: Annotated[User, Depends(require_admin)],
    db: AsyncSession = Depends(get_db),
) -> SMSGatewayConfigResponse:
    """Retrieve current active carrier configuration (Admin Only, passwords masked)."""
    return await _build_gateway_config_response(db)


@router.post("/config", response_model=SMSGatewayConfigResponse, summary="Update SMS Gateway Carrier Settings")
async def update_gateway_config(
    payload: SMSGatewayConfigPayload,
    current_user: Annotated[User, Depends(require_admin)],
    db: AsyncSession = Depends(get_db),
) -> SMSGatewayConfigResponse:
    """Save live carrier settings (Admin Only: Twilio, Ethio Telecom, or Android GSM Modem)."""
    # Deactivate previous configs
    old_res = await db.execute(select(SMSGatewayConfig))
    for old in old_res.scalars().all():
        old.is_active = False

    new_cfg = SMSGatewayConfig(
        provider=payload.provider,
        is_active=payload.is_active,
        twilio_account_sid=payload.twilio_account_sid,
        twilio_auth_token=payload.twilio_auth_token,
        twilio_from_number=payload.twilio_from_number,
        ethio_url=payload.ethio_url,
        ethio_username=payload.ethio_username,
        ethio_password=payload.ethio_password,
        ethio_shortcode=payload.ethio_shortcode or "907",
        android_gateway_url=payload.android_gateway_url,
        android_gateway_token=payload.android_gateway_token,
        africastalking_username=payload.africastalking_username,
        africastalking_api_key=payload.africastalking_api_key,
        africastalking_sender_id=payload.africastalking_sender_id,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_cfg)
    await db.commit()
    await db.refresh(new_cfg)

    return await _build_gateway_config_response(db)


@router.post("/test-connection", response_model=TestSMSConnectionResponse, summary="Send Live Test SMS to Handset")
async def test_sms_connection(
    payload: TestSMSConnectionRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: AsyncSession = Depends(get_db),
) -> TestSMSConnectionResponse:
    """Send an immediate test message through the configured carrier and report exact results."""
    clean_phone = format_ethiopian_phone(payload.phone_number)
    text = payload.message or "Mettu Karl Hospital: Testing Live SMS Gateway Connection. *907#"

    log = await sms_service.send_custom_sms(
        db=db,
        recipient_phone=clean_phone,
        message_text=text,
        lang="om",
    )

    is_live = bool(log.error_message and "Delivered" in log.error_message)

    return TestSMSConnectionResponse(
        success=is_live,
        phone_number=clean_phone,
        provider_used="Carrier Dispatcher",
        carrier_message=log.error_message or "Processed",
        dispatch_log_id=log.id,
    )


@router.post("/send", response_model=SMSDispatchResponse, summary="Dispatch SMS via Active Gateway")
async def send_sms_notification(
    payload: SMSDispatchRequest,
    current_user: Annotated[User, Depends(sms_dispatch_guard)],
    db: AsyncSession = Depends(get_db),
) -> SMSDispatchResponse:
    """Send an automated SMS alert to a patient's mobile phone."""
    clean_phone = format_ethiopian_phone(payload.phone_number)

    if payload.template_key:
        log = await sms_service.send_sms(
            db=db,
            recipient_phone=clean_phone,
            template_key=payload.template_key,
            lang=payload.language,
            **payload.parameters,
        )
    elif payload.custom_message:
        log = await sms_service.send_custom_sms(
            db=db,
            recipient_phone=clean_phone,
            message_text=payload.custom_message,
            lang=payload.language,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either template_key or custom_message",
        )

    is_delivered = bool(log.error_message and "Delivered" in log.error_message)

    return SMSDispatchResponse(
        id=log.id,
        recipient_phone=log.recipient_phone,
        message_text=log.message_text,
        language=log.language,
        status=log.status.value,
        channel=log.channel.value,
        sent_at=log.sent_at.isoformat() if log.sent_at else None,
        carrier_note=log.error_message,
        is_carrier_delivered=is_delivered,
        error_message=log.error_message,
    )


@router.post("/ussd", response_model=USSDSessionResponse, summary="Process Ethio Telecom USSD (*907# / *804#)")
async def process_ussd_session(payload: USSDSessionRequest) -> USSDSessionResponse:
    """Simulate and handle interactive USSD session from basic phones without smartphone/internet."""
    res = sms_service.handle_ussd(
        session_id=payload.session_id,
        phone_number=payload.phone_number,
        text=payload.text,
        lang=payload.language,
    )
    return USSDSessionResponse(
        session_id=payload.session_id,
        response=res["response"],
        action=res["action"],
    )


@router.get("/logs", summary="List SMS dispatch logs")
async def get_sms_logs(
    current_user: Annotated[User, Depends(require_admin)],
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Retrieve recent outgoing SMS messages and delivery status."""
    stmt = select(SMSNotificationLog).order_by(desc(SMSNotificationLog.id)).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()

    return [
        {
            "id": l.id,
            "recipient_phone": l.recipient_phone,
            "message_text": l.message_text,
            "language": l.language,
            "status": l.status.value,
            "channel": l.channel.value,
            "error_message": l.error_message,
            "created_at": l.created_at.isoformat(),
            "sent_at": l.sent_at.isoformat() if l.sent_at else None,
        }
        for l in logs
    ]


@router.get("/templates", summary="Get localized SMS templates")
async def get_sms_templates(
    current_user: Annotated[User, Depends(require_staff)],
) -> Dict[str, Any]:
    """Retrieve available message templates and supported languages."""
    return {
        "templates": TEMPLATES,
        "supported_languages": ["om", "am", "en"],
        "ussd_shortcodes": ["*907#", "*804#"],
    }
