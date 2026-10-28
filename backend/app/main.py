"""
Mettu Karl Hospital Information System - Main Application Entry Point

Configures FastAPI with CORS, Sentry error tracking, Prometheus metrics,
middleware, and includes all API routers.
"""
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from app.core.config import settings
from app.api.v1.router import api_v1_router
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Hardened Security Headers Middleware.
    Protects against XSS, clickjacking, MIME sniffing, and framing attacks.
    """
    async def dispatch(self, request: StarletteRequest, call_next):
        response: StarletteResponse = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "frame-ancestors 'none'; "
            "object-src 'none';"
        )
        return response


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""

    # Initialize Sentry if DSN is configured
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[
                StarletteIntegration(transaction_style="endpoint"),
                FastApiIntegration(transaction_style="endpoint"),
            ],
            traces_sample_rate=0.1,
            environment=settings.APP_ENV,
            release=settings.APP_VERSION,
        )

    application = FastAPI(
        title=settings.APP_NAME,
        description="Hospital Information System API for Mettu Karl Referral Hospital",
        version=settings.APP_VERSION,
        docs_url="/api/docs" if settings.APP_DEBUG else None,
        redoc_url="/api/redoc" if settings.APP_DEBUG else None,
        openapi_url="/api/openapi.json" if settings.APP_DEBUG else None,
    )

    # CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Hardened HTTP Security Headers Middleware
    application.add_middleware(SecurityHeadersMiddleware)

    # Include routers
    application.include_router(api_v1_router, prefix="/api/v1")

    # Prometheus metrics
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/health", "/metrics"],
    ).instrument(application).expose(application, endpoint="/metrics", include_in_schema=False)

    return application


app = create_application()


@app.on_event("startup")
async def startup_event() -> None:
    """Application startup: initialize connections."""
    from app.core.database import engine
    from app.models import Base  # noqa: F401 - ensures models are registered
    # In production, run alembic migrations instead
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Application shutdown: close connections gracefully."""
    from app.core.database import engine
    from app.core.redis_client import close_redis_pool
    await engine.dispose()
    await close_redis_pool()
