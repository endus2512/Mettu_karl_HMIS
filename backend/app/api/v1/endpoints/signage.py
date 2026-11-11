"""
Public Read & Admin-Protected Control Endpoints for the Digital LED Marquee Signboard.
"""
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_roles
from app.models.hrm import HospitalSignageConfig
from app.models.user import User, UserRole
from app.schemas.signage import SignageConfigResponse, SignageConfigUpdate

router = APIRouter()
logger = logging.getLogger(__name__)
SIGNAGE_BLOB_PATH = "signage/config.json"


def _blob_enabled() -> bool:
    """Return True when Vercel Blob RW token is configured for shared serverless state."""
    return bool(os.environ.get("BLOB_READ_WRITE_TOKEN"))


async def _read_signage_from_blob() -> Optional[SignageConfigResponse]:
    """Read shared LED signage config from Vercel private Blob store if configured."""
    if not _blob_enabled():
        return None
    try:
        from vercel import blob

        result = await blob.get_blob(SIGNAGE_BLOB_PATH, access="private")
        payload = json.loads(result.body.decode("utf-8"))
        return SignageConfigResponse.model_validate(payload)
    except Exception as exc:
        if exc.__class__.__name__ == "BlobNotFoundError":
            return None
        logger.warning("Failed reading LED signage config from Vercel Blob: %s", exc)
        return None


async def _write_signage_to_blob(state: SignageConfigResponse) -> None:
    """Persist LED signage config to Vercel private Blob store for cross-instance sync."""
    if not _blob_enabled():
        return
    try:
        from vercel import blob

        payload_bytes = state.model_dump_json().encode("utf-8")
        await blob.put_blob(
            SIGNAGE_BLOB_PATH,
            payload_bytes,
            access="private",
            content_type="application/json",
            add_random_suffix=False,
            allow_overwrite=True,
            cache_control_max_age=0,
        )
    except Exception as exc:
        logger.exception("Failed persisting LED signage config to Vercel Blob: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to persist Digital LED signage configuration to shared storage.",
        ) from exc


async def _ensure_signage_table(db: AsyncSession) -> None:
    """Create the signage table idempotently if it does not yet exist."""
    conn = await db.connection()
    await conn.run_sync(lambda sync_conn: HospitalSignageConfig.__table__.create(sync_conn, checkfirst=True))


async def _get_or_create_signage_config(db: AsyncSession) -> HospitalSignageConfig:
    """Return the active LED signage row, seeding defaults if missing."""
    await _ensure_signage_table(db)
    stmt = select(HospitalSignageConfig).order_by(HospitalSignageConfig.id.desc()).limit(1)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()
    if config is None:
        config = HospitalSignageConfig(
            message="METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL",
            color_preset="amber_yellow",
            color_hex="#ffb800",
            speed=1.0,
            font_scale=1.0,
            letter_spacing=0.12,
            glow_intensity=80,
            show_grid_dots=True,
            show_scanlines=True,
            is_playing=True,
            direction="rtl",
            offset_y=0,
            updated_at=datetime.now(timezone.utc),
            updated_by="System Default",
        )
        db.add(config)
        await db.flush()
        await db.refresh(config)
    return config


@router.get(
    "",
    response_model=SignageConfigResponse,
    summary="Get Active Digital LED Marquee Signboard Configuration (Public)",
)
async def get_led_signage_config(
    request: Request,
    response: Response,
) -> SignageConfigResponse:
    """Return the currently configured hospital Digital LED marquee state."""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    blob_state = await _read_signage_from_blob()
    if blob_state is not None:
        return blob_state

    override = request.app.dependency_overrides.get(get_db)
    if override is not None:
        agen = override()
        db = await anext(agen)
        try:
            config = await _get_or_create_signage_config(db)
            await db.commit()
            return SignageConfigResponse.model_validate(config)
        finally:
            await agen.aclose()

    from app.core.bootstrap import ensure_database_ready
    from app.core.database import AsyncSessionLocal

    await ensure_database_ready()
    async with AsyncSessionLocal() as db:
        config = await _get_or_create_signage_config(db)
        await db.commit()
        return SignageConfigResponse.model_validate(config)


@router.put(
    "",
    response_model=SignageConfigResponse,
    summary="Update Digital LED Marquee Signboard (Admin / Super Admin Only)",
)
async def update_led_signage_config(
    payload: SignageConfigUpdate,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
) -> SignageConfigResponse:
    """Persist Admin updates to the Digital LED marquee signboard."""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    config = await _get_or_create_signage_config(db)
    config.message = payload.message
    config.color_preset = payload.color_preset
    config.color_hex = payload.color_hex
    config.speed = payload.speed
    config.font_scale = payload.font_scale
    config.letter_spacing = payload.letter_spacing
    config.glow_intensity = payload.glow_intensity
    config.show_grid_dots = payload.show_grid_dots
    config.show_scanlines = payload.show_scanlines
    config.is_playing = payload.is_playing
    config.direction = payload.direction
    config.offset_y = payload.offset_y
    config.updated_at = datetime.now(timezone.utc)
    config.updated_by = f"{current_user.full_name} ({current_user.role.value})"

    await db.commit()
    await db.refresh(config)
    validated = SignageConfigResponse.model_validate(config)
    await _write_signage_to_blob(validated)
    return validated
