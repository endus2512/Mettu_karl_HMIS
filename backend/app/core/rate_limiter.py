"""
Anti-Brute-Force Rate Limiting & PII Protection Utilities.

Protects Patient Portal authentication and sensitive endpoints from:
1. Automated credential stuffing / brute-force dictionary attacks.
2. Denial of service on national ID verification.
3. Sensitive patient PII exposure in logs and audit trails.
"""
import time
from typing import Dict, Tuple
from fastapi import HTTPException, status
from app.core.redis_client import redis_get, redis_set, redis_delete

# In-memory sliding window fallback
_rate_limit_cache: Dict[str, Tuple[int, float]] = {}

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 900  # 15 minutes lockout


def mask_pii(identifier: str) -> str:
    """Mask sensitive national ID (Fayda) or phone number for audit logging."""
    clean = identifier.strip()
    if clean.startswith("FAN-") and len(clean) >= 14:
        return f"{clean[:8]}****{clean[-4:]}"
    if len(clean) >= 8:
        return f"{clean[:4]}****{clean[-3:]}"
    return "****"


async def check_patient_login_rate_limit(client_ip: str, identifier: str) -> None:
    """
    Check if client IP or patient identifier is currently rate limited / locked out.
    Raises HTTPException 429 if the threshold has been exceeded.
    """
    now = time.time()
    keys_to_check = [f"ratelimit:ip:{client_ip}", f"ratelimit:id:{identifier}"]

    for key in keys_to_check:
        # Check Redis first
        val = await redis_get(key)
        attempts = int(val) if val and val.isdigit() else 0

        # Check in-memory fallback
        if key in _rate_limit_cache:
            mem_attempts, expires_at = _rate_limit_cache[key]
            if now < expires_at:
                attempts = max(attempts, mem_attempts)
            else:
                _rate_limit_cache.pop(key, None)

        if attempts >= MAX_FAILED_ATTEMPTS:
            masked = mask_pii(identifier)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Dhimma eegumsa iccitii dhukkubsataaf: Yaaliin seensaa heddumminaan godhameera. "
                    f"Akaawuntii ({masked}) daqiiqaa 15'f cufameera. / "
                    f"Too many failed login attempts for {masked}. Temporarily locked for 15 minutes to prevent unauthorized access."
                ),
            )


async def record_patient_login_failure(client_ip: str, identifier: str) -> int:
    """Increment the failed login attempt counter for IP and identifier."""
    now = time.time()
    expires_at = now + LOCKOUT_DURATION_SECONDS
    keys = [f"ratelimit:ip:{client_ip}", f"ratelimit:id:{identifier}"]
    max_count = 1

    for key in keys:
        current_val = await redis_get(key)
        count = (int(current_val) + 1) if current_val and current_val.isdigit() else 1

        if key in _rate_limit_cache:
            mem_count, mem_exp = _rate_limit_cache[key]
            if now < mem_exp:
                count = max(count, mem_count + 1)

        await redis_set(key, str(count), expire_seconds=LOCKOUT_DURATION_SECONDS)
        _rate_limit_cache[key] = (count, expires_at)
        max_count = max(max_count, count)

    return max_count


async def clear_patient_login_rate_limit(client_ip: str, identifier: str) -> None:
    """Reset rate limit counters on successful authentication."""
    keys = [f"ratelimit:ip:{client_ip}", f"ratelimit:id:{identifier}"]
    for key in keys:
        await redis_delete(key)
        _rate_limit_cache.pop(key, None)
