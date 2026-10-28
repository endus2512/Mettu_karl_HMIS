"""
Audit logging service for HIPAA/compliance-grade audit trails.

Every significant action (login, data access, modifications) is logged:
1. To the PostgreSQL audit_logs table (queryable, structured)
2. To an append-only flat file (tamper-evident secondary record)

Log entries are immutable — never updated or deleted.
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


async def record_audit_event(
    db: AsyncSession,
    *,
    user_id: int | None,
    action: str,
    resource: str,
    resource_id: str | None = None,
    ip_address: str | None = None,
    result: str = "success",
    detail: dict[str, Any] | None = None,
) -> AuditLog:
    """
    Record an audit event to both the database and audit log file.

    Args:
        db: Async database session.
        user_id: ID of the user performing the action (None for system actions).
        action: Action performed (e.g., "LOGIN", "READ_PATIENT", "UPDATE_RECORD").
        resource: Resource type affected (e.g., "Patient", "User").
        resource_id: Identifier of the specific resource affected.
        ip_address: Client IP address from the request.
        result: Outcome — "success" or "failure".
        detail: Optional structured metadata about the action.

    Returns:
        The created AuditLog ORM instance.
    """
    now = datetime.now(timezone.utc)

    # Persist to database
    audit_entry = AuditLog(
        timestamp=now,
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        ip_address=ip_address,
        result=result,
        detail=json.dumps(detail) if detail else None,
    )
    db.add(audit_entry)
    await db.flush()  # get the ID without committing

    # Append to flat audit log file
    _write_audit_file(
        timestamp=now.isoformat(),
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        ip_address=ip_address,
        result=result,
        detail=detail,
    )

    return audit_entry


def _write_audit_file(
    timestamp: str,
    user_id: int | None,
    action: str,
    resource: str,
    resource_id: str | None,
    ip_address: str | None,
    result: str,
    detail: dict[str, Any] | None,
) -> None:
    """
    Append a JSON audit line to the audit log file.

    Falls back to stderr logging if the file cannot be written
    (e.g., missing directory in development).
    """
    log_line = json.dumps(
        {
            "timestamp": timestamp,
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "ip_address": ip_address,
            "result": result,
            "detail": detail,
        },
        ensure_ascii=False,
    )

    try:
        log_path = Path(settings.AUDIT_LOG_FILE)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with log_path.open("a", encoding="utf-8") as f:
            f.write(log_line + "\n")
    except OSError as exc:
        # Don't let audit logging failures break the request
        logger.warning("Could not write audit log file: %s | Entry: %s", exc, log_line)
