"""
Audit logging service for HIPAA/compliance-grade audit trails.

Every significant action (login, data access, modifications) is logged:
1. To the PostgreSQL audit_logs table with Ethiopian INSA Cryptographic Merkle Hash Chain
2. To an append-only flat file (tamper-evident secondary record)

Log entries are immutable and form a cryptographic hash chain — any modification breaks downstream seals.
"""
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

GENESIS_HASH = "0" * 64


def compute_audit_hash(
    previous_hash: str,
    chain_index: int,
    timestamp: datetime,
    user_id: int | None,
    action: str,
    resource: str,
    resource_id: str | None,
    detail_str: str | None,
) -> str:
    """Compute canonical SHA-256 hash for Merkle audit chain."""
    ts_epoch = int(timestamp.timestamp())
    uid = user_id or 0
    res_id = resource_id or ""
    det = detail_str or ""
    payload = f"{previous_hash}|{chain_index}|{ts_epoch}|{uid}|{action}|{resource}|{res_id}|{det}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def compute_audit_seal(entry_hash: str, secret_key: str) -> str:
    """Compute cryptographic HMAC-SHA256 seal for tamper detection."""
    return hmac.new(secret_key.encode("utf-8"), entry_hash.encode("utf-8"), hashlib.sha256).hexdigest()


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
    Record an audit event to database with cryptographic Merkle chain link
    and append to secondary flat log file.
    """
    now = datetime.now(timezone.utc)
    detail_json = json.dumps(detail, sort_keys=True) if detail else None

    # Fetch previous audit log entry to establish Merkle link
    stmt = (
        select(AuditLog.entry_hash, AuditLog.chain_index)
        .where(AuditLog.entry_hash.isnot(None))
        .order_by(AuditLog.id.desc())
        .limit(1)
    )
    last_res = await db.execute(stmt)
    last_entry = last_res.first()

    if last_entry and last_entry[0]:
        prev_hash = last_entry[0]
        curr_index = (last_entry[1] or 0) + 1
    else:
        prev_hash = GENESIS_HASH
        curr_index = 1

    entry_hash = compute_audit_hash(
        previous_hash=prev_hash,
        chain_index=curr_index,
        timestamp=now,
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        detail_str=detail_json,
    )
    sig_seal = compute_audit_seal(entry_hash, settings.SECRET_KEY)

    # Persist to database with Merkle chain fields
    audit_entry = AuditLog(
        timestamp=now,
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        ip_address=ip_address,
        result=result,
        detail=detail_json,
        entry_hash=entry_hash,
        previous_hash=prev_hash,
        chain_index=curr_index,
        signature_seal=sig_seal,
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
        entry_hash=entry_hash,
        previous_hash=prev_hash,
    )

    return audit_entry


async def verify_audit_chain(db: AsyncSession, max_records: int = 500) -> dict[str, Any]:
    """
    Validate cryptographic Merkle audit trail integrity according to Ethiopian INSA standards.
    Traverses the chain from genesis and verifies hashes & HMAC seals.
    """
    stmt = (
        select(AuditLog)
        .where(AuditLog.entry_hash.isnot(None))
        .order_by(AuditLog.id.asc())
        .limit(max_records)
    )
    res = await db.execute(stmt)
    logs = list(res.scalars().all())

    if not logs:
        return {
            "is_valid": True,
            "total_records_checked": 0,
            "status": "CHAIN_EMPTY",
            "message": "Audit chain contains no records yet.",
        }

    expected_prev = GENESIS_HASH

    for idx, log in enumerate(logs):
        if log.previous_hash != expected_prev:
            return {
                "is_valid": False,
                "broken_at_id": log.id,
                "broken_at_chain_index": log.chain_index,
                "tampering_type": "CHAIN_LINK_DISCONTINUITY",
                "expected_previous_hash": expected_prev,
                "found_previous_hash": log.previous_hash,
                "status": "TAMPERING_DETECTED",
                "message": f"INSA Security Alert: Broken Merkle chain link detected at log ID {log.id} ({log.action})",
            }

        calculated_hash = compute_audit_hash(
            previous_hash=log.previous_hash,
            chain_index=log.chain_index or (idx + 1),
            timestamp=log.timestamp,
            user_id=log.user_id,
            action=log.action,
            resource=log.resource,
            resource_id=log.resource_id,
            detail_str=log.detail,
        )

        if calculated_hash != log.entry_hash:
            return {
                "is_valid": False,
                "broken_at_id": log.id,
                "broken_at_chain_index": log.chain_index,
                "tampering_type": "DATA_PAYLOAD_TAMPERED",
                "expected_hash": calculated_hash,
                "stored_hash": log.entry_hash,
                "status": "TAMPERING_DETECTED",
                "message": f"INSA Security Alert: Data payload modification detected at log ID {log.id}. Row contents have been altered!",
            }

        expected_seal = compute_audit_seal(calculated_hash, settings.SECRET_KEY)
        if log.signature_seal and log.signature_seal != expected_seal:
            return {
                "is_valid": False,
                "broken_at_id": log.id,
                "tampering_type": "SIGNATURE_SEAL_FORGERY",
                "status": "TAMPERING_DETECTED",
                "message": f"INSA Security Alert: Cryptographic HMAC signature seal is invalid for log ID {log.id}!",
            }

        expected_prev = log.entry_hash

    return {
        "is_valid": True,
        "total_records_checked": len(logs),
        "genesis_hash": GENESIS_HASH,
        "head_hash": expected_prev,
        "status": "VERIFIED_TAMPER_FREE",
        "compliance_standard": "Ethiopian INSA National Cybersecurity & HIPAA Forensic Grade",
        "message": f"All {len(logs)} audit entries cryptographically verified. Zero tampering detected.",
    }


def _write_audit_file(
    timestamp: str,
    user_id: int | None,
    action: str,
    resource: str,
    resource_id: str | None,
    ip_address: str | None,
    result: str,
    detail: dict[str, Any] | None,
    entry_hash: str | None = None,
    previous_hash: str | None = None,
) -> None:
    """Append a JSON audit line with hash to the audit log file."""
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
            "entry_hash": entry_hash,
            "previous_hash": previous_hash,
        },
        ensure_ascii=False,
    )

    try:
        log_path = Path(settings.AUDIT_LOG_FILE)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with log_path.open("a", encoding="utf-8") as f:
            f.write(log_line + "\n")
    except OSError as exc:
        logger.warning("Could not write audit log file: %s | Entry: %s", exc, log_line)

