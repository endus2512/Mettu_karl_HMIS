"""
Async SQLAlchemy database engine and session factory.

Uses asyncpg driver for PostgreSQL with connection pooling configured
for production workloads.
"""
import os
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# Async engine with connection pooling (serverless-safe on Vercel)
engine_kwargs: dict[str, Any] = {
    "echo": settings.APP_DEBUG,
    "pool_pre_ping": True,
}
if "sqlite" not in settings.DATABASE_URL:
    connect_args: dict[str, Any] = {}
    if os.environ.get("VERCEL") or "-pooler." in settings.DATABASE_URL:
        connect_args["statement_cache_size"] = 0
    if connect_args:
        engine_kwargs["connect_args"] = connect_args
    if os.environ.get("VERCEL"):
        engine_kwargs["poolclass"] = NullPool
    else:
        engine_kwargs.update({
            "pool_size": 20,
            "max_overflow": 10,
            "pool_recycle": 3600,
        })

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

# Session factory
AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, Any]:
    """
    Async generator that yields a database session.

    Ensures database schema & baseline seeds exist (including cold serverless
    invocations), commits on success, and rolls back on exception.
    """
    from app.core.bootstrap import ensure_database_ready

    await ensure_database_ready()

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
