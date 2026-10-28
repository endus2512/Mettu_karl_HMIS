"""
Health and readiness check endpoints for Kubernetes probes.
"""
from typing import Any, Dict

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.redis_client import get_redis_client

router = APIRouter()


@router.get("/health", summary="Liveness probe")
async def health() -> Dict[str, str]:
    """Basic liveness probe confirming FastAPI process is active."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "env": settings.APP_ENV,
    }


@router.get("/readiness", summary="Readiness probe")
async def readiness(db: AsyncSession = Depends(get_db)) -> JSONResponse:
    """
    Readiness probe verifying DB and Redis downstream connections.
    Returns 503 if any critical service is unavailable.
    """
    checks: Dict[str, Any] = {"database": "unknown", "redis": "unknown"}
    is_ready = True

    # 1. Check PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "connected"
    except Exception as e:
        checks["database"] = f"unreachable: {str(e)}"
        is_ready = False

    # 2. Check Redis
    try:
        redis_client = get_redis_client()
        pong = await redis_client.ping()
        checks["redis"] = "connected" if pong else "unreachable"
    except Exception as e:
        checks["redis"] = f"unreachable: {str(e)}"
        is_ready = False

    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if is_ready else "not_ready",
            "dependencies": checks,
        },
    )
