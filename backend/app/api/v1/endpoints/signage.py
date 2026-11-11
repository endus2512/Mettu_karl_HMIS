"""
Public Read & Admin-Protected Control Endpoints for the Digital LED Marquee Signboard.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_roles
from app.models.hrm import HospitalSignageConfig
from app.models.user import User, UserRole
from app.schemas.signage import SignageConfigResponse, SignageConfigUpdate

router = APIRouter()


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
    db: AsyncSession = Depends(get_db),
) -> HospitalSignageConfig:
    """Return the currently configured hospital Digital LED marquee state."""
    return await _get_or_create_signage_config(db)


@router.put(
    "",
    response_model=SignageConfigResponse,
    summary="Update Digital LED Marquee Signboard (Admin / Super Admin Only)",
)
async def update_led_signage_config(
    payload: SignageConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
) -> HospitalSignageConfig:
    """Persist Admin updates to the Digital LED marquee signboard."""
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
    return config
