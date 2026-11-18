"""
Transactional Email Dispatch Service for Mettu Karl Referral Hospital HMIS.

Supports:
1. Gmail SMTP (smtp.gmail.com:587 STARTTLS with Gmail App Password)
2. Resend HTTPS API (https://api.resend.com/emails — works over port 443)
3. Custom Institutional SMTP Server

Reads active Admin configuration from database (`email_gateway_configs`, Fernet-encrypted)
first, then falls back cleanly to environment variables (`RESEND_API_KEY`, `SMTP_*`).
"""
import asyncio
from email.message import EmailMessage
import logging
import smtplib
from typing import Optional, Tuple

import httpx
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decrypt_credential_vault
from app.models.notification import EmailGatewayConfig

logger = logging.getLogger(__name__)


def _send_smtp_sync(
    host: str,
    port: int,
    user: str,
    password: str,
    from_email: str,
    use_tls: bool,
    recipient_email: str,
    subject: str,
    body_text: str,
) -> Tuple[bool, str]:
    """Blocking SMTP send helper executed inside a background worker thread."""
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_email or user
    msg["To"] = recipient_email
    msg.set_content(body_text)

    try:
        with smtplib.SMTP(host, port, timeout=12) as server:
            if use_tls:
                server.starttls()
            server.login(user, password)
            server.send_message(msg)
        logger.info("SMTP email delivered to %s via %s", recipient_email, host)
        return True, f"Live Email Delivered via SMTP ({host})"
    except smtplib.SMTPAuthenticationError:
        return (
            False,
            "SMTP Auth Failed: For Gmail, make sure 2-Step Verification is ON and use a 16-character Gmail App Password (not your regular login password).",
        )
    except Exception as exc:
        logger.error("SMTP email delivery failed for %s: %s", recipient_email, exc)
        return False, f"SMTP Error: {str(exc)[:120]}"


async def _send_resend_async(
    api_key: str,
    from_email: str,
    recipient_email: str,
    subject: str,
    body_text: str,
) -> Tuple[bool, str]:
    """Send transactional email via Resend HTTPS API (port 443)."""
    sender = from_email.strip() if from_email and "@" in from_email else "Mettu Karl HMIS <onboarding@resend.dev>"
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key.strip()}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": sender,
                    "to": [recipient_email],
                    "subject": subject,
                    "text": body_text,
                },
            )
            if resp.status_code in (200, 201):
                return True, f"Live Email Delivered via Resend API to {recipient_email}"
            return False, f"Resend HTTP {resp.status_code}: {resp.text[:140]}"
    except Exception as exc:
        logger.error("Resend email delivery failed: %s", exc)
        return False, f"Resend Network Error: {str(exc)[:110]}"


class EmailService:
    """Async transactional email engine backed by Admin DB config + Env Var fallback."""

    async def _get_active_config(
        self, db: Optional[AsyncSession]
    ) -> Optional[EmailGatewayConfig]:
        if not db:
            return None
        try:
            res = await db.execute(
                select(EmailGatewayConfig)
                .where(EmailGatewayConfig.is_active == True)  # noqa: E712
                .order_by(desc(EmailGatewayConfig.id))
            )
            return res.scalar_one_or_none()
        except Exception as exc:
            logger.warning("Failed to query email_gateway_configs: %s", exc)
            return None

    async def send_email(
        self,
        recipient_email: str,
        subject: str,
        body_text: str,
        db: Optional[AsyncSession] = None,
    ) -> Tuple[bool, str]:
        """Dispatch email using active DB config first, then environment variables."""
        db_cfg = await self._get_active_config(db)

        # 1. Resend HTTPS API (DB config or RESEND_API_KEY env var)
        resend_key = (
            decrypt_credential_vault(db_cfg.resend_api_key_enc)
            if db_cfg and db_cfg.provider == "resend" and db_cfg.resend_api_key_enc
            else None
        ) or (settings.RESEND_API_KEY.strip() if settings.RESEND_API_KEY else None)

        if resend_key and (not db_cfg or db_cfg.provider == "resend"):
            from_addr = (
                (db_cfg.smtp_from_email if db_cfg and db_cfg.smtp_from_email else None)
                or "Mettu Karl HMIS <onboarding@resend.dev>"
            )
            return await _send_resend_async(
                api_key=resend_key,
                from_email=from_addr,
                recipient_email=recipient_email,
                subject=subject,
                body_text=body_text,
            )

        # 2. Gmail / Custom SMTP (DB config or SMTP_* env vars)
        smtp_host = (
            (db_cfg.smtp_host if db_cfg and db_cfg.provider in ("gmail", "custom_smtp") else None)
            or settings.SMTP_HOST
        )
        smtp_port = (
            db_cfg.smtp_port
            if db_cfg and db_cfg.provider in ("gmail", "custom_smtp") and db_cfg.smtp_port
            else settings.SMTP_PORT
        )
        smtp_user = (
            (db_cfg.smtp_user if db_cfg and db_cfg.provider in ("gmail", "custom_smtp") else None)
            or settings.SMTP_USER
        )
        smtp_password = (
            decrypt_credential_vault(db_cfg.smtp_password_enc)
            if db_cfg and db_cfg.provider in ("gmail", "custom_smtp") and db_cfg.smtp_password_enc
            else None
        ) or settings.SMTP_PASSWORD
        smtp_from = (
            (db_cfg.smtp_from_email if db_cfg and db_cfg.smtp_from_email else None)
            or smtp_user
            or settings.SMTP_FROM_EMAIL
        )
        smtp_tls = db_cfg.smtp_use_tls if db_cfg else settings.SMTP_USE_TLS

        if smtp_host and smtp_user and smtp_password:
            return await asyncio.to_thread(
                _send_smtp_sync,
                smtp_host.strip(),
                int(smtp_port or 587),
                smtp_user.strip(),
                smtp_password.strip().replace(" ", ""),
                smtp_from.strip(),
                bool(smtp_tls),
                recipient_email.strip(),
                subject,
                body_text,
            )

        return (
            False,
            "SIMULATED: No live Email/Gmail gateway configured yet. Configure Gmail App Password or Resend API in /sms-ussd -> Carrier Setup -> Gmail / Email OTP.",
        )

    async def send_password_reset_otp(
        self,
        recipient_email: str,
        full_name: str,
        otp_code: str,
        minutes: int = 5,
        lang: str = "en",
        client_ip: str = "unknown",
        db: Optional[AsyncSession] = None,
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
        return await self.send_email(recipient_email, subject, body, db=db)

    async def send_password_changed_alert(
        self,
        recipient_email: str,
        full_name: str,
        client_ip: str = "unknown",
        db: Optional[AsyncSession] = None,
    ) -> Tuple[bool, str]:
        subject = "SECURITY ALERT: Mettu Karl HMIS Password Changed"
        body = (
            f"Dear {full_name},\n\n"
            f"Your Mettu Karl Referral Hospital HMIS password was just changed from IP {client_ip}.\n"
            "All previous login sessions have been signed out automatically.\n\n"
            "If you did NOT authorize this change, contact Hospital ICT Help Desk immediately "
            "(Ext. 4401 / +251 47 111 0204 / ict-support@mettukarl.gov.et).\n"
        )
        return await self.send_email(recipient_email, subject, body, db=db)


email_service = EmailService()
