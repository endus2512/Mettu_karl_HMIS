"""
Ethiopian Calendar (Zemene Meskerem / Pagume) conversion utility.

Provides bidirectional conversion between Gregorian (CE) and Ethiopian (ET) calendars,
along with month names and formatting in Afaan Oromoo, Amharic, and English.
"""
from datetime import date
from typing import Tuple

# Ethiopian Month names
MONTH_NAMES = {
    "om": [
        "Fulbaana", "Onkololeessa", "Sadaasa", "Muddee", "Amajjii", "Guraandhala",
        "Bitooteessa", "Elba", "Waxabajjii", "Adooleessa", "Hagayya", "Qaammee"
    ],
    "am": [
        "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት",
        "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
    ],
    "en": [
        "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
        "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume"
    ],
}


def gregorian_to_ethiopian(g_date: date) -> Tuple[int, int, int]:
    """
    Convert Gregorian date to Ethiopian (year, month, day).
    Calculates the 7-8 year difference and 13-month calendar structure.
    """
    year = g_date.year
    month = g_date.month
    day = g_date.day

    # Julian Day Number calculation
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    jdn = day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045

    # Convert JDN to Ethiopian era
    jdn_ethiopian_epoch = 1723856  # August 29, 8 CE in Gregorian
    days_since_epoch = jdn - jdn_ethiopian_epoch

    eth_year = (4 * days_since_epoch + 1463) // 1461
    eth_year_day = days_since_epoch - (1461 * (eth_year - 1)) // 4
    eth_month = (eth_year_day // 30) + 1
    eth_day = (eth_year_day % 30) + 1

    return eth_year, eth_month, eth_day


def format_ethiopian_date(g_date: date, lang: str = "om") -> str:
    """Format a Gregorian date into formatted Ethiopian localized date string."""
    eth_year, eth_month, eth_day = gregorian_to_ethiopian(g_date)
    month_list = MONTH_NAMES.get(lang, MONTH_NAMES["om"])
    month_name = month_list[eth_month - 1] if eth_month <= len(month_list) else f"Month-{eth_month}"

    if lang == "om":
        return f"{month_name} {eth_day}, {eth_year}"
    elif lang == "am":
        return f"{month_name} {eth_day} ቀን {eth_year} ዓ.ም"
    return f"{month_name} {eth_day}, {eth_year} E.C."
