"""
Redis connection pool and client utilities.

Provides a shared Redis connection pool for caching, session management,
and rate limiting across the application.
"""
import redis.asyncio as redis
from redis.asyncio import Redis
from redis.asyncio.connection import ConnectionPool

from app.core.config import settings

# Global connection pool (initialized once at startup)
_pool: ConnectionPool | None = None


def get_redis_pool() -> ConnectionPool:
    """Get or create the Redis connection pool."""
    global _pool
    if _pool is None:
        _pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=50,
            decode_responses=True,
        )
    return _pool


def get_redis_client() -> Redis:
    """
    Get a Redis client using the shared connection pool.

    Returns:
        Redis async client instance.
    """
    return redis.Redis(connection_pool=get_redis_pool())


async def close_redis_pool() -> None:
    """Close the Redis connection pool on application shutdown."""
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None


# In-memory fallback dictionary for when Redis is offline or in testing
_memory_store: dict[str, str] = {}


# Convenience helpers

async def redis_set(key: str, value: str, expire_seconds: int | None = None) -> None:
    """Set a key in Redis with optional expiry, falling back to memory if Redis is unavailable."""
    try:
        client = get_redis_client()
        await client.set(key, value, ex=expire_seconds)
    except Exception:
        _memory_store[key] = value


async def redis_get(key: str) -> str | None:
    """Get a value from Redis by key, falling back to memory if Redis is unavailable."""
    try:
        client = get_redis_client()
        return await client.get(key)
    except Exception:
        return _memory_store.get(key)


async def redis_delete(key: str) -> None:
    """Delete a key from Redis, falling back to memory if Redis is unavailable."""
    try:
        client = get_redis_client()
        await client.delete(key)
    except Exception:
        _memory_store.pop(key, None)


async def redis_exists(key: str) -> bool:
    """Check if a key exists in Redis, falling back to memory if Redis is unavailable."""
    try:
        client = get_redis_client()
        return bool(await client.exists(key))
    except Exception:
        return key in _memory_store
