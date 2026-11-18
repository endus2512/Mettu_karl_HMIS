"""
SMTP Email Dispatch Service for Mettu Karl Referral Hospital HMIS.

Supports transactional security notifications (Password Recovery 5-minute OTP
and Post-Reset Security Alerts) via standard SMTP/STARTTLS using Python stdlib
with zero external package dependencies.
"""
import asyncio
from email.message import EmailMessage
import logging
import smtplib
from typing import Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_smtp_sync(recipient_email: str, subject: str, body_text: str) -> Tuple[bool, str]:
    """Blocking SMTP send helper executed inside a background worker thread."""
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return (
            False,
            "SIMULATED: SMTP credentials (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) not configured.",
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    msg["To"] = recipient_email
    msg.set_content(body_text)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("SMTP email delivered to %s", recipient_email)
        return True, f"Live Email Delivered via SMTP ({settings.SMTP_HOST})"
    except Exception as exc:
        logger.error("SMTP email delivery failed for %s: %s", recipient_email, exc)
        return False, f"SMTP Error: {str(exc)[:90]}"


class EmailService:
    """Async wrapper for transactional security emails."""

    async def send_password_reset_otp(
        self,
        recipient_email: str,
        full_name: str,
        otp_code: str,
        minutes: int = 5,
        lang: str = "en",
        client_ip: str = "unknown",
    ) -> Tuple[bool, str]:
        if lang == "om":
            subject = "Hospitaala Mettu Karl HMIS — Koodii Mirkaneessaa (Daqiiqaa 5)"
            body = (
                f"Kabajamoo {full_name},\n\n"
                f"Koodiin mirkaneessaa jecha icchitii haaromsuu keessanii: {otp_code}\n"
                f"Yeroo hojjetu: Daqiiqaa {minutes} qofa.\n"
                f"IP Gaaffii: {client_ip}\n\n"
                "Yoo gaaffii kana isin hin goone ta'e koodii kana nama kamiyyuutti hin himinaa; "
                "battalumatti Kutaa ICT Hospitaalaa (4401 / +251 47 111 0204) qunnamaa.\n"
            )
        elif lang == "am":
            subject = "ሜቱ ካርል ሆስፒታል HMIS — የይለፍ ቃል ማረጋገጫ ኮድ (5 ደቂቃ)"
            body = (
                f"ክቡር/ክብርት {full_name}፣\n\n"
                f"የይለፍ ቃል መቀየሪያ ማረጋገጫ ኮድዎ፡ {otp_code}\n"
                f"የሚያገለግለው ለ{minutes} ደቂቃ ብቻ ነው።\n"
                f"የጥያቄ IP፡ {client_ip}\n\n"
                "ይህን ጥያቄ እርስዎ ካልጠየቁ ኮዱን ለማንም አያጋሩ፤ ወዲያውኑ የሆስፒታሉን ICT ክፍል (4401) ያሳውቁ።\n"
            )
        else:
            subject = "Mettu Karl Hospital HMIS — Password Recovery Code (5 Minutes)"
            body = (
                f"Dear {full_name},\n\n"
                f"Your one-time password recovery verification code is: {otp_code}\n"
                f"Valid for: {minutes} minutes only.\n"
                f"Request IP: {client_ip}\n\n"
                "If you did NOT request this password reset, do NOT share this code with anyone "
                "and alert Hospital ICT Security immediately (Ext. 4401 / +251 47 111 0204).\n"
            )
        return await asyncio.to_thread(_send_smtp_sync, recipient_email, subject, body)

    async def send_password_changed_alert(
        self,
        recipient_email: str,
        full_name: str,
        client_ip: str = "unknown",
    ) -> Tuple[bool, str]:
        subject = "SECURITY ALERT: Mettu Karl HMIS Password Changed"
        body = (
            f"Dear {full_name},\n\n"
            f"Your Mettu Karl Referral Hospital HMIS password was just changed from IP {client_ip}.\n"
            "All previous login sessions have been signed out automatically.\n\n"
            "If you did NOT authorize this change, contact Hospital ICT Help Desk immediately "
            "(Ext. 4401 / +251 47 111 0204 / ict-support@mettukarl.gov.et).\n"
        )
        return await asyncio.to_thread(_send_smtp_sync, recipient_email, subject, body)


email_service = EmailService()
