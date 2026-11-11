"""
Pydantic schemas for Digital LED Marquee Signboard Configuration.
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class SignageConfigUpdate(BaseModel):
    """Schema for Admin updates to the Digital LED Marquee Signboard."""

    message: str = Field(..., min_length=1, max_length=300)
    color_preset: str = Field(default="amber_yellow", max_length=40)
    color_hex: str = Field(default="#ffb800", pattern=r"^#[0-9A-Fa-f]{6}$")
    speed: float = Field(default=1.0, ge=0.1, le=5.0)
    font_scale: float = Field(default=1.0, ge=0.55, le=1.5)
    letter_spacing: float = Field(default=0.12, ge=0.02, le=0.28)
    glow_intensity: int = Field(default=80, ge=0, le=100)
    show_grid_dots: bool = Field(default=True)
    show_scanlines: bool = Field(default=True)
    is_playing: bool = Field(default=True)
    direction: Literal["rtl", "ltr"] = Field(default="rtl")
    offset_y: int = Field(default=0, ge=-40, le=60)

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Signage message cannot be blank.")
        return trimmed


class SignageConfigResponse(SignageConfigUpdate):
    """Public response model for the Digital LED Marquee Signboard."""

    id: int
    updated_at: datetime
    updated_by: str

    model_config = {"from_attributes": True}
