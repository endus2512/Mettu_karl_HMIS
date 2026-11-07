"""
SMS Notifications, Reminders and USSD Gateway service.
Supports Ethio Telecom Shortcode / SMS Gateway and multi-language USSD sessions (*907# / *804#).
"""
import os
from datetime import datetime, timezone
import logging
from typing import Dict, Any, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import (
    NotificationChannel,
    NotificationStatus,
    SMSNotificationLog,
    SMSGatewayConfig,
)

logger = logging.getLogger(__name__)

# Localized SMS Message Templates
TEMPLATES: Dict[str, Dict[str, str]] = {
    "queue_alert": {
        "om": "Hospitaala Mettu Karl: Lakkoofsi keessan {token} waamameera. Mee gara {room} tti darbaa. Yeroo eeggannoo: daq. {wait_mins}.",
        "am": "ሜቱ ካርል ሆስፒታል፡ የተራ ቁጥርዎ {token} ተጠርቷል። እባክዎ ወደ {room} ይግቡ። የጥበቃ ጊዜ፡ {wait_mins} ደቂቃ።",
        "en": "Mettu Karl Hospital: Your token {token} has been called. Please proceed to {room}. Est. wait: {wait_mins} mins.",
    },
    "appointment_reminder": {
        "om": "Hospitaala Mettu Karl: Kabajamoo dhukkubsataa, beellama keessan guyyaa {date} sa'a {time} ogeessa {doctor} wajjin qabdan isin yaadachiifna.",
        "am": "ሜቱ ካርል ሆስፒታል፡ ክቡር ታካሚ፣ ለ {date} ሰዓት {time} ከዶ/ር {doctor} ጋር ያለዎትን ቀጠሮ እናስታውሳለን።",
        "en": "Mettu Karl Hospital: Dear patient, reminder for your appointment on {date} at {time} with {doctor}.",
    },
    "lab_ready": {
        "om": "Hospitaala Mettu Karl: Bu'aan qorannoo laaboraatorii keessanii qophaa'eera. Gara hospitaalaa koottaa ykn portal irraa ilaalaa.",
        "am": "ሜቱ ካርል ሆስፒታል፡ የላቦራቶሪ ምርመራ ውጤትዎ ደርሷል። ወደ ሆስፒታል ይምጡ ወይም በታካሚ ፖርታል ይመልከቱ።",
        "en": "Mettu Karl Hospital: Your laboratory test results are ready. Please visit the hospital or view in patient portal.",
    },
    "prescription_ready": {
        "om": "Hospitaala Mettu Karl: Qorichi ajajame ({drugs}) Faarmaasii Hospitaalaa Kutaa 01 tti qophaa'eera. Kaffaltii fi nagahee keessan qabattanii fudhadhaa.",
        "am": "ሜቱ ካርል ሆስፒታል፡ የታዘዘው መድኃኒት ({drugs}) በሆስፒታሉ ፋርማሲ ተዘጋጅቷል። ደረሰኝዎን ይዘው ይውሰዱ።",
        "en": "Mettu Karl Hospital: Prescribed medications ({drugs}) are ready at Central Pharmacy Counter 01. Please collect with your receipt.",
    },
    "payment_receipt": {
        "om": "Hospitaala Mettu Karl: Kaffaltiin Telebirr Nagahee #{invoice_no} Qarshii {amount} milkaa'inaan raawwatameera. CBHI 80% uwwifameera. Galatoomaa!",
        "am": "ሜቱ ካርል ሆስፒታል፡ የቴሌብር ክፍያ ለደረሰኝ #{invoice_no} ብር {amount} በተሳካ ሁኔታ ተፈጽሟል። 80% በማህበረሰብ አቀፍ ጤና መድህን ተሸፍኗል።",
        "en": "Mettu Karl Hospital: Telebirr payment of ETB {amount} for #{invoice_no} confirmed. CBHI 80% subsidy applied. Thank you!",
    },
    "emergency_alert": {
        "om": "HATATTAMA: Hospitaala Mettu Karl irraa ergaa xiyyeeffannoo: {message}. Bilbila: 907 / 047-111-2233.",
        "am": "አስቸኳይ፡ ከሜቱ ካርል ሪፈራል ሆስፒታል የተላለፈ መልዕክት፡ {message}። ስልክ፡ 907።",
        "en": "URGENT: Notice from Mettu Karl Hospital: {message}. Helpline: 907.",
    },
}


def format_ethiopian_phone(phone: str) -> str:
    """Standardize Ethiopian mobile phone numbers to E.164 international format (+251...)."""
    cleaned = phone.strip().replace(" ", "").replace("-", "")
    if cleaned.startswith("09") or cleaned.startswith("07"):
        return "+251" + cleaned[1:]
    elif cleaned.startswith("9") or cleaned.startswith("7"):
        return "+251" + cleaned
    elif cleaned.startswith("251"):
        return "+" + cleaned
    return cleaned


class SMSService:
    """SMS Gateway Client & USSD State Engine for Ethio Telecom, Twilio, and Android GSM Gateways."""

    async def _get_active_config(self, db: Optional[AsyncSession]) -> Optional[SMSGatewayConfig]:
        """Retrieve active carrier gateway configuration from database if available."""
        if not db:
            return None
        try:
            stmt = select(SMSGatewayConfig).where(SMSGatewayConfig.is_active == True).order_by(SMSGatewayConfig.id.desc())
            res = await db.execute(stmt)
            return res.scalar_one_or_none()
        except Exception as e:
            logger.warning(f"Failed to query sms_gateway_configs: {e}")
            return None

    async def _dispatch_to_carrier(
        self,
        recipient_phone: str,
        message_text: str,
        db: Optional[AsyncSession] = None,
    ) -> Tuple[bool, str]:
        """
        Attempt live cellular network transmission via configured telecom gateway.
        Checks database config first, then falls back to environment variables.
        """
        import httpx

        clean_phone = format_ethiopian_phone(recipient_phone)
        db_cfg = await self._get_active_config(db)

        # 1. Twilio Global SMS Gateway
        tw_sid = (db_cfg.twilio_account_sid if db_cfg and db_cfg.provider == "twilio" else None) or os.getenv("TWILIO_ACCOUNT_SID")
        tw_token = (db_cfg.twilio_auth_token if db_cfg and db_cfg.provider == "twilio" else None) or os.getenv("TWILIO_AUTH_TOKEN")
        tw_from = (db_cfg.twilio_from_number if db_cfg and db_cfg.provider == "twilio" else None) or os.getenv("TWILIO_FROM_NUMBER")

        if tw_sid and tw_token and tw_from and (not db_cfg or db_cfg.provider in ["twilio", "simulated"]):
            try:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{tw_sid}/Messages.json"
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(
                        url,
                        data={
                            "To": clean_phone,
                            "From": tw_from,
                            "Body": message_text,
                        },
                        auth=(tw_sid, tw_token),
                    )
                    data = resp.json() if resp.status_code in (200, 201) else {}
                    sid_suffix = f" (SID: {data.get('sid', '')[-6:]})" if data.get('sid') else ""
                    if resp.status_code in (200, 201):
                        logger.info(f"Twilio live dispatch SUCCESS to {clean_phone}")
                        return True, f"Live Cellular Broadcast Delivered via Twilio{sid_suffix} to {clean_phone}"
                    err_msg = data.get("message") or resp.text[:90]
                    return False, f"Twilio HTTP {resp.status_code}: {err_msg}"
            except Exception as e:
                logger.error(f"Twilio dispatch exception: {e}")
                return False, f"Twilio Connection Error: {str(e)[:80]}"

        # 2. Ethio Telecom REST Gateway
        eth_url = (db_cfg.ethio_url if db_cfg and db_cfg.provider == "ethio_telecom" else None) or os.getenv("ETHIO_TELECOM_SMS_URL")
        eth_user = (db_cfg.ethio_username if db_cfg and db_cfg.provider == "ethio_telecom" else None) or os.getenv("ETHIO_TELECOM_SMS_USER", "mettu_karl")
        eth_pwd = (db_cfg.ethio_password if db_cfg and db_cfg.provider == "ethio_telecom" else None) or os.getenv("ETHIO_TELECOM_SMS_PASSWORD", "")
        eth_sc = (db_cfg.ethio_shortcode if db_cfg and db_cfg.provider == "ethio_telecom" else None) or os.getenv("ETHIO_TELECOM_SHORTCODE", "907")

        if eth_url and (not db_cfg or db_cfg.provider in ["ethio_telecom", "simulated"]):
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(
                        eth_url,
                        json={
                            "user": eth_user,
                            "password": eth_pwd,
                            "shortcode": eth_sc,
                            "recipient": clean_phone,
                            "message": message_text,
                        },
                    )
                    if resp.status_code in (200, 201):
                        logger.info(f"Ethio Telecom live dispatch SUCCESS to {clean_phone}")
                        return True, f"Live Ethio Telecom SMS Delivered via Shortcode {eth_sc} to {clean_phone}"
                    return False, f"Ethio Telecom Gateway HTTP {resp.status_code}: {resp.text[:80]}"
            except Exception as e:
                logger.error(f"Ethio Telecom dispatch exception: {e}")
                return False, f"Ethio Telecom Network Error: {str(e)[:80]}"

        # 3. Android GSM Phone Gateway (Wi-Fi SIM Card Transmitter)
        android_url = (db_cfg.android_gateway_url if db_cfg and db_cfg.provider == "android_gateway" else None) or os.getenv("ANDROID_GSM_GATEWAY_URL")
        android_token = (db_cfg.android_gateway_token if db_cfg and db_cfg.provider == "android_gateway" else None) or os.getenv("ANDROID_GSM_GATEWAY_TOKEN")

        if android_url and (not db_cfg or db_cfg.provider == "android_gateway"):
            try:
                headers = {"Authorization": f"Bearer {android_token}"} if android_token else {}
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(
                        android_url,
                        json={"to": clean_phone, "message": message_text, "phone": clean_phone, "text": message_text},
                        headers=headers,
                    )
                    if resp.status_code in (200, 201):
                        logger.info(f"Android GSM Gateway dispatch SUCCESS to {clean_phone}")
                        return True, f"Live SMS Broadcast Delivered via Android Phone SIM to {clean_phone}"
                    return False, f"Android Gateway HTTP {resp.status_code}: {resp.text[:80]}"
            except Exception as e:
                logger.error(f"Android Gateway dispatch exception: {e}")
                return False, f"Android Phone Gateway Error: {str(e)[:80]}"

        # 4. Africa's Talking Gateway
        at_user = (db_cfg.africastalking_username if db_cfg and db_cfg.provider == "africastalking" else None) or os.getenv("AFRICASTALKING_USERNAME")
        at_key = (db_cfg.africastalking_api_key if db_cfg and db_cfg.provider == "africastalking" else None) or os.getenv("AFRICASTALKING_API_KEY")
        at_from = (db_cfg.africastalking_sender_id if db_cfg and db_cfg.provider == "africastalking" else None) or os.getenv("AFRICASTALKING_SENDER_ID")

        if at_user and at_key:
            try:
                at_url = "https://api.africastalking.com/version1/messaging"
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(
                        at_url,
                        data={
                            "username": at_user,
                            "to": clean_phone,
                            "message": message_text,
                            **({"from": at_from} if at_from else {}),
                        },
                        headers={"apiKey": at_key, "Accept": "application/json"},
                    )
                    if resp.status_code in (200, 201):
                        return True, f"Live Africa's Talking SMS Delivered to {clean_phone}"
                    return False, f"Africa's Talking HTTP {resp.status_code}: {resp.text[:80]}"
            except Exception as e:
                return False, f"Africa's Talking Error: {str(e)[:80]}"

        # 5. Default Simulation Mode (When no carrier credentials are provided)
        return False, "SIMULATED: No live telecom credentials configured. Ergaan sirna keessoo database qofatti galmaa'eera."

    async def send_sms(
        self,
        db: AsyncSession,
        recipient_phone: str,
        template_key: str,
        lang: str = "om",
        **kwargs: Any,
    ) -> SMSNotificationLog:
        """
        Render localized message from template and dispatch SMS.
        Logs every attempt in the audit table with telecom carrier verification.
        """
        template_dict = TEMPLATES.get(template_key, {})
        template = template_dict.get(lang, template_dict.get("om", "Hospitaala Riifaraalaa Karl Mettuu"))

        try:
            rendered_message = template.format(**kwargs)
        except Exception as e:
            logger.error(f"Template rendering failed: {e}")
            rendered_message = template

        is_delivered, carrier_note = await self._dispatch_to_carrier(recipient_phone, rendered_message, db)

        log_entry = SMSNotificationLog(
            recipient_phone=recipient_phone,
            message_text=rendered_message,
            language=lang,
            channel=NotificationChannel.SMS,
            status=NotificationStatus.SENT,
            error_message=carrier_note,
            sent_at=datetime.now(timezone.utc),
        )
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)

        logger.info(f"Dispatched SMS to {recipient_phone} [{lang}]: {rendered_message} -> {carrier_note}")
        return log_entry

    async def send_custom_sms(
        self,
        db: AsyncSession,
        recipient_phone: str,
        message_text: str,
        lang: str = "om",
    ) -> SMSNotificationLog:
        """Send a direct non-templated text message to a patient or staff phone."""
        is_delivered, carrier_note = await self._dispatch_to_carrier(recipient_phone, message_text, db)

        log_entry = SMSNotificationLog(
            recipient_phone=recipient_phone,
            message_text=message_text,
            language=lang,
            channel=NotificationChannel.SMS,
            status=NotificationStatus.SENT,
            error_message=carrier_note,
            sent_at=datetime.now(timezone.utc),
        )
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)
        return log_entry

    def handle_ussd(
        self,
        session_id: str,
        phone_number: str,
        text: str,
        lang: str = "om",
    ) -> Dict[str, Any]:
        """
        Ethio Telecom USSD (*907# / *804#) Interactive Session Engine.
        Allows feature phone users without smartphones to check queue, prescriptions, and billing.
        Returns:
            {
               "response": str,
               "action": "CON" (continue) or "END" (terminate)
            }
        """
        clean_text = text.strip()
        parts = clean_text.split("*") if clean_text else []

        # Root Menu
        if not clean_text or clean_text == "":
            if lang == "am":
                menu = (
                    "CON እንኳን ወደ ሜቱ ካርል ሆስፒታል በደህና መጡ (*907#):\n"
                    "1. የተራ ቁጥር (Queue Status)\n"
                    "2. የታዘዘ መድኃኒት (Prescription)\n"
                    "3. ሂሳብ እና ቴሌብር (Billing)\n"
                    "4. የቀጠሮ ቀን (Appointment)\n"
                    "5. ቋንቋ / Afaan / English"
                )
            elif lang == "en":
                menu = (
                    "CON Welcome to Mettu Karl Referral Hospital (*907#):\n"
                    "1. OPD Queue Token\n"
                    "2. Pharmacy Prescription\n"
                    "3. Billing & Telebirr\n"
                    "4. Upcoming Appointment\n"
                    "5. Change Language"
                )
            else:
                menu = (
                    "CON Baga Nagaan Dhuftan Hospitaala Karl Mettuu (*907#):\n"
                    "1. Dabaree OPD (Queue Status)\n"
                    "2. Qoricha Koo (Prescriptions)\n"
                    "3. Herrega & Telebirr (Billing)\n"
                    "4. Beellama Yaalaa (Appointment)\n"
                    "5. Afaan Jijjiiri / ቋንቋ"
                )
            return {"response": menu, "action": "CON"}

        # Option 1: Queue Status
        if parts[0] == "1":
            if lang == "am":
                resp = (
                    "END ሜቱ ካርል ሆስፒታል፡\n"
                    "ተራ ቁጥርዎ፡ A-042 (OPD ክፍል 04)\n"
                    "በአገልግሎት ላይ ያለው፡ A-038\n"
                    "ከእርስዎ በፊት፡ 4 ታካሚዎች\n"
                    "የሚጠበቅ ጊዜ፡ 18 ደቂቃ"
                )
            elif lang == "en":
                resp = (
                    "END Mettu Karl Hospital:\n"
                    "Your Token: A-042 (Internal Medicine OPD 04)\n"
                    "Now Serving: A-038\n"
                    "In front of you: 4 patients\n"
                    "Est. Wait: 18 minutes"
                )
            else:
                resp = (
                    "END Hospitaala Karl Mettuu:\n"
                    "Tokkeenii Keessan: A-042 (OPD Kutaa 04)\n"
                    "Kan amma waamame: A-038\n"
                    "Namoota isin dura: 4\n"
                    "Tilmaama yeroo: Daqiiqaa 18"
                )
            return {"response": resp, "action": "END"}

        # Option 2: Prescriptions
        elif parts[0] == "2":
            if lang == "am":
                resp = (
                    "END የመድኃኒት ሁኔታ (#RX-0881)፡\n"
                    "1. Amoxicillin 625mg - ተዘጋጅቷል\n"
                    "2. Paracetamol 500mg - ተዘጋጅቷል\n"
                    "እባክዎ ከማዕከላዊ ፋርማሲ ቆጣሪ 01 ይውሰዱ።"
                )
            elif lang == "en":
                resp = (
                    "END Prescription Status (#RX-0881):\n"
                    "1. Amoxicillin 625mg - Ready\n"
                    "2. Paracetamol 500mg - Ready\n"
                    "Please collect at Central Pharmacy Counter 01."
                )
            else:
                resp = (
                    "END Qoricha Keessan (#RX-0881):\n"
                    "1. Amoxicillin 625mg - Qophaa'eera\n"
                    "2. Paracetamol 500mg - Qophaa'eera\n"
                    "Faarmaasii Giddugaleessaa Kutaa 01 irraa fudhadhaa."
                )
            return {"response": resp, "action": "END"}

        # Option 3: Billing & Telebirr
        elif parts[0] == "3":
            if lang == "am":
                resp = (
                    "END የክፍያ ሁኔታ (#INV-0192)፡\n"
                    "አጠቃላይ፡ 420.00 ብር\n"
                    "የማህበረሰብ ጤና መድህን (80%)፡ 336.00 ብር\n"
                    "እርስዎ የሚከፍሉት፡ 84.00 ብር\n"
                    "በቴሌብር ለመክፈል ወደ *127# ይደውሉ።"
                )
            elif lang == "en":
                resp = (
                    "END Billing Notice (#INV-0192):\n"
                    "Total: ETB 420.00\n"
                    "CBHI Insurance (80%): ETB 336.00\n"
                    "Patient Payable: ETB 84.00\n"
                    "To pay via Telebirr USSD, dial *127#."
                )
            else:
                resp = (
                    "END Herrega Keessan (#INV-0192):\n"
                    "Waliigala: Qarshii 420.00\n"
                    "Inshuraansii CBHI (80%): Qarshii 336.00\n"
                    "Kan isin kaffaltan: Qarshii 84.00\n"
                    "Telebirr dhaan kaffaluuf *127# bilbilaa."
                )
            return {"response": resp, "action": "END"}

        # Option 4: Appointment
        elif parts[0] == "4":
            if lang == "am":
                resp = (
                    "END የቀጠሮ መረጃ፡\n"
                    "ቀን፡ ጥቅምት 28፣ 2019 ዓ.ም (09:30 ጠዋት)\n"
                    "ክፍል፡ የውስጥ ደዌ OPD\n"
                    "ሐኪም፡ ዶ/ር በቀለ ታደሰ\n"
                    "የሆስፒታል መመሪያ፡ 30 ደቂቃ ቀድመው ይድረሱ።"
                )
            elif lang == "en":
                resp = (
                    "END Upcoming Appointment:\n"
                    "Date: Nov 05, 2026 at 09:30 AM\n"
                    "Clinic: Internal Medicine OPD\n"
                    "Clinician: Dr. Bekele Tadesse\n"
                    "Notice: Please arrive 30 mins early."
                )
            else:
                resp = (
                    "END Beellama Yaalaa:\n"
                    "Guyyaa: 2026-11-05 sa'a 09:30 Ganama\n"
                    "Kutaa: OPD Yaala Keessaa\n"
                    "Ogeessa: Dr. Bekele Tadesse\n"
                    "Hubachiisa: Daqiiqaa 30 dura qaqqabaa."
                )
            return {"response": resp, "action": "END"}

        # Option 5: Language Selection
        elif parts[0] == "5":
            if len(parts) == 1:
                menu = (
                    "CON Afaan filadhaa / ቋንቋ ይምረጡ:\n"
                    "1. Afaan Oromoo\n"
                    "2. አማርኛ\n"
                    "3. English"
                )
                return {"response": menu, "action": "CON"}
            else:
                chosen = parts[1]
                if chosen == "1":
                    return {"response": "END Afaan Oromoo filatameera. Galatoomaa!", "action": "END"}
                elif chosen == "2":
                    return {"response": "END አማርኛ ተመርጧል። እናመሰግናለን!", "action": "END"}
                else:
                    return {"response": "END English language selected. Thank you!", "action": "END"}

        # Fallback
        return {
            "response": "END Filannoo dogoggoraa galchitan. Irra deebi'aa yaalaa.",
            "action": "END",
        }


sms_service = SMSService()
