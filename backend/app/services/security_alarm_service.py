"""
Security Alarm & Live Workforce Telemetry Service.

Dispatches persistent database notifications (`ClinicalNotification`) and
real-time WebSocket broadcasts to Hospital Administrators (`admin` / `super_admin`)
for new staff sign-ups, first-time logins across all staff roles, blocked/pending
login attempts, and privilege escalation probes. Also computes live work status
from normalized timestamps.
"""
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import ClinicalNotification
from app.models.user import ApprovalStatus, User, UserRole
from app.services.event_bus_service import clinical_event_bus

logger = logging.getLogger("mkh.security_alarms")

STAFF_ALARM_CATEGORIES = (
    "staff_signup_alarm",
    "staff_first_login",
    "staff_login_blocked_alarm",
    "staff_impersonation_alarm",
    "staff_security_alarm",
    "staff_status_change",
)

WORKING_NOW_THRESHOLD_SECONDS = 300   # Active within last 5 minutes
RECENT_THRESHOLD_SECONDS = 1800       # Active within last 30 minutes

ROLE_GROUP_ORDER = {
    "doctor": 0,
    "nurse": 1,
    "pharmacist": 2,
    "lab_diag": 3,
    "support_finance": 4,
    "admin_security": 5,
}


def classify_staff_role_group(
    role_or_dept: Optional[str],
    risk_flag: Optional[str] = None,
) -> str:
    """Group staff requests and alarms into clean profession/workstation buckets."""
    if risk_flag:
        return "admin_security"
    val = (role_or_dept or "").strip().lower()
    if val in {"doctor", "specialist", "consultant"}:
        return "doctor"
    if val in {"nurse", "paramedic"}:
        return "nurse"
    if val in {"pharmacist", "pharmacy"}:
        return "pharmacist"
    if val in {"lab_tech", "lab_technician", "technician", "radiographer", "biomedical", "laboratory", "lab"}:
        return "lab_diag"
    if val in {"admin", "ict_admin", "super_admin", "superadmin", "root", "unverified"}:
        return "admin_security"
    return "support_finance"


def portal_path_for_role(role: UserRole) -> str:
    """Resolve authoritative workstation portal path for a verified staff role."""
    mapping = {
        UserRole.DOCTOR: "/portal/doctor",
        UserRole.NURSE: "/portal/nurse",
        UserRole.PHARMACIST: "/portal/pharmacy",
        UserRole.LAB_TECH: "/portal/lab",
        UserRole.TECHNICIAN: "/portal/lab",
        UserRole.BILLING: "/portal/billing",
        UserRole.INSURANCE_OFFICER: "/portal/billing",
        UserRole.RECEPTIONIST: "/portal/reception",
        UserRole.ADMIN: "/portal/admin",
        UserRole.SUPER_ADMIN: "/portal/admin",
        UserRole.PATIENT: "/patient-portal",
    }
    return mapping.get(role, "/portal/doctor")


def _utc_aware(dt: Optional[datetime]) -> Optional[datetime]:
    """Normalize naive datetimes (e.g. from SQLite) to UTC-aware datetimes."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def compute_staff_work_status(
    user: User,
    now: Optional[datetime] = None,
) -> Tuple[str, Optional[int]]:
    """
    Compute a staff member's live work status and idle duration in seconds.

    Returns:
        (work_status, idle_seconds) where work_status is one of:
        'working_now', 'recent', 'offline', 'blocked', 'pending'.
    """
    current_time = _utc_aware(now) or datetime.now(timezone.utc)
    approval_state = getattr(user, "approval_status", ApprovalStatus.APPROVED.value)

    if approval_state == ApprovalStatus.PENDING.value:
        return "pending", None
    if not user.is_active or approval_state == ApprovalStatus.REJECTED.value:
        return "blocked", None
    if getattr(user, "last_activity_path", None) == "LOGGED_OUT":
        return "offline", None

    last_ts = _utc_aware(user.last_seen_at) or _utc_aware(user.last_login_at)
    if last_ts is None:
        return "offline", None

    idle_seconds = max(0, int((current_time - last_ts).total_seconds()))
    if idle_seconds <= WORKING_NOW_THRESHOLD_SECONDS:
        return "working_now", idle_seconds
    if idle_seconds <= RECENT_THRESHOLD_SECONDS:
        return "recent", idle_seconds
    return "offline", idle_seconds


async def emit_admin_security_alarm(
    db: AsyncSession,
    *,
    event_type: str,
    title: str,
    message: str,
    severity: str = "critical",
    category: str = "staff_security_alarm",
    actor_user: Optional[User] = None,
    actor_name: Optional[str] = None,
    actor_role: Optional[str] = None,
    staff_id: Optional[str] = None,
    username: Optional[str] = None,
    department: Optional[str] = None,
    license_number: Optional[str] = None,
    risk_flag: Optional[str] = None,
    client_ip: Optional[str] = None,
    extra_metadata: Optional[Dict[str, Any]] = None,
    commit: bool = True,
) -> Optional[ClinicalNotification]:
    """
    Persist an urgent security notification for Hospital Administrators (`target_role='admin'`)
    and broadcast immediately over the WebSocket ClinicalEventBus.

    Important: `target_user_id` is intentionally left `None` so newly registered or blocked
    non-admin staff never receive Admin security alarms targeted at them after approval.
    """
    resolved_name = (
        (actor_user.full_name if actor_user else None)
        or actor_name
        or username
        or staff_id
        or "Unverified Applicant"
    )
    resolved_role = (
        (actor_user.role.value if actor_user and hasattr(actor_user.role, "value") else None)
        or actor_role
        or "staff"
    )
    resolved_staff_id = (actor_user.staff_id if actor_user else None) or staff_id
    resolved_username = (actor_user.username if actor_user else None) or username
    resolved_dept = (actor_user.department if actor_user else None) or department
    resolved_license = (actor_user.license_number if actor_user else None) or license_number
    resolved_risk = (actor_user.risk_flag if actor_user else None) or risk_flag

    payload_meta: Dict[str, Any] = {
        "event_type": event_type,
        "user_id": actor_user.id if actor_user else None,
        "username": resolved_username,
        "staff_id": resolved_staff_id,
        "full_name": resolved_name,
        "email": actor_user.email if actor_user else None,
        "phone_number": actor_user.phone_number if actor_user else None,
        "actor_role": resolved_role,
        "requested_role": (actor_user.requested_role if actor_user else None) or resolved_role,
        "department": resolved_dept,
        "license_number": resolved_license,
        "risk_flag": resolved_risk,
        "ip_address": client_ip,
    }
    if extra_metadata:
        payload_meta.update(extra_metadata)

    notif = ClinicalNotification(
        title=title[:255],
        message=message,
        severity=severity,
        category=category[:50],
        sender_id=actor_user.id if actor_user else None,
        sender_name=resolved_name[:100],
        sender_role=resolved_role[:50],
        target_role=UserRole.ADMIN.value,
        target_user_id=None,
        department=resolved_dept[:100] if resolved_dept else None,
        metadata_json=json.dumps(payload_meta, sort_keys=True),
        is_read=False,
    )
    try:
        db.add(notif)
        if commit:
            await db.commit()
            await db.refresh(notif)
        else:
            await db.flush()
    except Exception as exc:
        logger.warning(f"Failed to persist admin security alarm ({event_type}): {exc}")
        if commit:
            await db.rollback()
        return None

    ws_payload = {
        "id": notif.id,
        "event_type": event_type,
        "title": notif.title,
        "message": notif.message,
        "severity": notif.severity,
        "category": notif.category,
        "sender_name": notif.sender_name,
        "sender_role": notif.sender_role,
        "metadata": payload_meta,
        "timestamp": notif.created_at.isoformat(),
    }
    try:
        await clinical_event_bus.broadcast_to_roles(
            [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value],
            "ADMIN_SECURITY_ALARM",
            ws_payload,
        )
    except Exception as exc:
        logger.debug(f"WebSocket broadcast skipped for alarm {notif.id}: {exc}")

    return notif


async def record_staff_session_start(
    db: AsyncSession,
    user: User,
    client_ip: Optional[str] = None,
    entry_path: str = "/portal",
) -> bool:
    """
    Track login activity timestamps (`first_login_at`, `last_login_at`, `last_seen_at`)
    for any authenticated staff member and emit an urgent FIRST-TIME LOGIN alarm to Admin
    the very first time any Doctor, Nurse, Pharmacist, Lab Tech, Receptionist, Billing,
    or other staff role accesses the system.

    Returns:
        True if this session was the staff member's first-ever login, else False.
    """
    now = datetime.now(timezone.utc)
    is_first_login = (
        user.role != UserRole.PATIENT
        and user.first_login_at is None
    )

    if is_first_login:
        user.first_login_at = now
    user.last_login_at = now
    user.last_seen_at = now
    if client_ip:
        user.last_ip = client_ip
    if not user.last_activity_path:
        user.last_activity_path = entry_path

    if is_first_login:
        role_label = user.role.value.upper()
        ident = user.staff_id or user.username
        await emit_admin_security_alarm(
            db,
            event_type="STAFF_FIRST_LOGIN",
            title=f"FIRST-TIME {role_label} LOGIN: {user.full_name} ({ident})",
            message=(
                f"Staff member {user.full_name} (ID: {ident}, Role: {role_label}, "
                f"Dept: {user.department or 'Hospital Workstation'}, License: {user.license_number or 'N/A'}) "
                f"logged into the system for the FIRST time from IP {client_ip or 'unknown'}."
            ),
            severity="critical",
            category="staff_first_login",
            actor_user=user,
            client_ip=client_ip,
            commit=True,
        )
    else:
        await db.commit()

    return is_first_login
