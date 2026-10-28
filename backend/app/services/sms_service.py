"""
SMS Notifications, Reminders and USSD Gateway service.
Supports Ethio Telecom Shortcode / SMS Gateway and multi-language USSD sessions (*907# / *804#).
"""
from datetime import datetime, timezone
import logging
from typing import Dict, Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import (
    NotificationChannel,
    NotificationStatus,
    SMSNotificationLog,
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


class SMSService:
    """SMS Gateway Client & USSD State Engine for Ethio Telecom integration."""

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
        Logs every attempt in the audit table.
        """
        template_dict = TEMPLATES.get(template_key, {})
        template = template_dict.get(lang, template_dict.get("om", "Hospitaala Riifaraalaa Karl Mettuu"))

        try:
            rendered_message = template.format(**kwargs)
        except Exception as e:
            logger.error(f"Template rendering failed: {e}")
            rendered_message = template

        log_entry = SMSNotificationLog(
            recipient_phone=recipient_phone,
            message_text=rendered_message,
            language=lang,
            channel=NotificationChannel.SMS,
            status=NotificationStatus.PENDING,
        )
        db.add(log_entry)
        await db.commit()

        # In production: Ethio Telecom REST SMS Gateway HTTP request
        logger.info(f"Dispatching SMS to {recipient_phone} [{lang}]: {rendered_message}")
        log_entry.status = NotificationStatus.SENT
        log_entry.sent_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(log_entry)

        return log_entry

    async def send_custom_sms(
        self,
        db: AsyncSession,
        recipient_phone: str,
        message_text: str,
        lang: str = "om",
    ) -> SMSNotificationLog:
        """Send a direct non-templated text message to a patient or staff phone."""
        log_entry = SMSNotificationLog(
            recipient_phone=recipient_phone,
            message_text=message_text,
            language=lang,
            channel=NotificationChannel.SMS,
            status=NotificationStatus.SENT,
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
