"""
SMS Gateway and USSD Telco Session Endpoints.
Integrates Ethio Telecom Bulk SMS and *907# USSD feature phone workflows.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.notification import SMSNotificationLog, NotificationStatus
from app.services.sms_service import sms_service, TEMPLATES

router = APIRouter()


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


@router.post("/send", response_model=SMSDispatchResponse, summary="Dispatch SMS via Ethio Telecom Gateway")
async def send_sms_notification(
    payload: SMSDispatchRequest,
    db: AsyncSession = Depends(get_db),
) -> SMSDispatchResponse:
    """Send an automated SMS alert to a patient's mobile phone."""
    if payload.template_key:
        log = await sms_service.send_sms(
            db=db,
            recipient_phone=payload.phone_number,
            template_key=payload.template_key,
            lang=payload.language,
            **payload.parameters,
        )
    elif payload.custom_message:
        log = await sms_service.send_custom_sms(
            db=db,
            recipient_phone=payload.phone_number,
            message_text=payload.custom_message,
            lang=payload.language,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either template_key or custom_message",
        )

    return SMSDispatchResponse(
        id=log.id,
        recipient_phone=log.recipient_phone,
        message_text=log.message_text,
        language=log.language,
        status=log.status.value,
        channel=log.channel.value,
        sent_at=log.sent_at.isoformat() if log.sent_at else None,
    )


@router.post("/ussd", response_model=USSDSessionResponse, summary="Process Ethio Telecom USSD (*907# / *804#)")
async def process_ussd_session(payload: USSDSessionRequest) -> USSDSessionResponse:
    """
    Simulate and handle interactive USSD session from basic phones without smartphone/internet.
    """
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
            "created_at": l.created_at.isoformat(),
            "sent_at": l.sent_at.isoformat() if l.sent_at else None,
        }
        for l in logs
    ]


@router.get("/templates", summary="Get localized SMS templates")
async def get_sms_templates() -> Dict[str, Any]:
    """Retrieve available message templates and supported languages."""
    return {
        "templates": TEMPLATES,
        "supported_languages": ["om", "am", "en"],
        "ussd_shortcodes": ["*907#", "*804#"],
    }
