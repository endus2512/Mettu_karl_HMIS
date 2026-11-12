"""
Application configuration using Pydantic BaseSettings.

All settings are read from environment variables or .env file.
Provides type-safe configuration with validation.
"""
import os
from functools import lru_cache
from typing import List
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_database_url() -> str:
    """Resolve database URL from standard Postgres env vars or fall back to SQLite."""
    for env_key in (
        "DATABASE_URL",
        "POSTGRES_URL",
        "POSTGRES_PRISMA_URL",
        "POSTGRES_URL_NON_POOLING",
        "STORAGE_POSTGRES_URL",
        "STORAGE_DATABASE_URL",
        "NEON_DATABASE_URL",
    ):
        val = (os.environ.get(env_key) or "").strip()
        if val:
            return val
    return (
        "sqlite+aiosqlite:////tmp/mettu_his.db"
        if os.environ.get("VERCEL")
        else "sqlite+aiosqlite:///./mettu_his.db"
    )


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Mettu Karl HIS"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    APP_DEBUG: bool = False
    SECRET_KEY: str = "ci-default-secret-key-mettu-karl-his"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = Field(default_factory=_default_database_url)

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Convert Postgres URLs to asyncpg format and normalize SSL query params."""
        url = v.strip() if isinstance(v, str) else ""
        if not url:
            url = _default_database_url()
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://") :]
        elif url.startswith("postgresql+psycopg2://"):
            url = "postgresql+asyncpg://" + url[len("postgresql+psycopg2://") :]
        elif url.startswith("postgresql+psycopg://"):
            url = "postgresql+asyncpg://" + url[len("postgresql+psycopg://") :]
        elif url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://") :]

        if url.startswith("postgresql+asyncpg://") and "?" in url:
            parsed = urlparse(url)
            cleaned_params: list[tuple[str, str]] = []
            has_ssl = False
            sslmode_val: str | None = None
            for k, val in parse_qsl(parsed.query, keep_blank_values=True):
                kl = k.lower()
                if kl == "channel_binding":
                    continue
                if kl == "sslmode":
                    sslmode_val = val.lower()
                    continue
                if kl == "ssl":
                    has_ssl = True
                cleaned_params.append((k, val))
            if sslmode_val and not has_ssl:
                if sslmode_val in {"require", "verify-ca", "verify-full"}:
                    cleaned_params.append(("ssl", "require"))
                elif sslmode_val == "disable":
                    cleaned_params.append(("ssl", "disable"))
            url = urlunparse(parsed._replace(query=urlencode(cleaned_params)))
        return url

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # MinIO / Object Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "mettu-karl-his"
    MINIO_SECURE: bool = False

    # Sentry
    SENTRY_DSN: str = ""

    # CORS
    CORS_ORIGINS: List[str] | str = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://mettu-karl-hospital.vercel.app",
        "https://endus2512.github.io",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins from comma-separated string, JSON array, or list."""
        if isinstance(v, str):
            stripped = v.strip()
            if stripped.startswith("["):
                import json

                parsed = json.loads(stripped)
                if isinstance(parsed, list):
                    return [str(origin).strip() for origin in parsed if str(origin).strip()]
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return v

    # FHIR
    FHIR_SERVER_BASE_URL: str = "http://localhost:8000/api/v1/fhir/r4"

    # Audit
    AUDIT_LOG_FILE: str = (
        "/tmp/mettu_audit.log"
        if os.environ.get("VERCEL")
        else "/var/log/mettu-karl-his/audit.log"
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()


settings: Settings = get_settings()
