"""
Edge Data Synchronization and Offline-First PWA API Endpoints.
Allows peripheral clinic outposts, field ambulances, and outreach clinics
to sync batched offline records to Mettu Karl central hospital server.
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.sync import (
    EdgeSyncBatchRequest,
    EdgeSyncBatchResponse,
    SyncStatusResponse,
)
from app.services.sync_service import process_edge_sync_batch

router = APIRouter()


@router.post(
    "/edge-batch",
    response_model=EdgeSyncBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest and merge offline edge batch transactions",
)
async def sync_edge_batch(
    batch: EdgeSyncBatchRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EdgeSyncBatchResponse:
    """
    Ingest a batch of offline patient records, vitals observations, and prescriptions.
    Applies idempotent deduplication and returns resolution mappings.
    """
    return await process_edge_sync_batch(db, batch, current_user)


@router.get(
    "/status",
    response_model=SyncStatusResponse,
    summary="Get central synchronization engine and conflict resolution status",
)
async def get_sync_status(
    current_user: Annotated[User, Depends(get_current_user)],
) -> SyncStatusResponse:
    """Return central server sync health, current UTC timestamp, and conflict strategy."""
    return SyncStatusResponse(
        status="operational",
        server_time=datetime.now(timezone.utc),
        conflict_resolution_strategy="last_write_wins_with_patient_merge",
        active_edge_stations_count=14,
    )
