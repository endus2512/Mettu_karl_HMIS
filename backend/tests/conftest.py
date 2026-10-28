"""
Pytest test fixtures for FastAPI HIS backend.
Uses SQLite in-memory database with async connection for fast and isolated unit tests.
"""
import asyncio
from collections.abc import AsyncGenerator
from datetime import date
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.patient import Gender, Patient
from app.models.user import User, UserRole

# Use SQLite in-memory async engine for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
def setup_test_env():
    """Configure environment for testing."""
    settings.APP_ENV = "test"
    settings.SECRET_KEY = "test-secret-key-mettu-karl-his-very-secure"


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database for each test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Test client with overridden get_db dependency."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def test_doctor_user(db_session: AsyncSession) -> User:
    """Create a test doctor user."""
    user = User(
        username="dr_karl",
        email="dr.karl@mettukarl.gov.et",
        full_name="Dr. Karl Mettu",
        hashed_password=hash_password("DoctorSecurePass123!"),
        role=UserRole.DOCTOR,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
def doctor_auth_headers(test_doctor_user: User) -> dict[str, str]:
    """Generate bearer authorization headers for the doctor user."""
    token = create_access_token(
        subject=test_doctor_user.id,
        extra_claims={"role": test_doctor_user.role.value, "username": test_doctor_user.username},
    )
    return {"Authorization": f"Bearer {token}"}
