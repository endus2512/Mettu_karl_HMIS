"""
Pydantic schemas for Clinical Notifications, Emergency Broadcasts, and WebSocket Event Bus.
"""
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class ClinicalNotificationBase(BaseModel):
    title: str = Field(..., max_length=255)
    message: str
    severity: Literal["info", "warning", "critical", "emergency"] = "info"
    category: Literal[
        "code_blue",
        "code_red",
        "lab_panic",
        "urgent_rx",
        "triage_red",
        "iomt_alarm",
        "mci_alert",
        "directive",
        "broadcast",
        "custom",
    ] = "broadcast"
    target_role: str = Field(default="all", description="'all' or specific role like 'doctor', 'nurse', etc.")
    target_user_id: Optional[int] = None
    department: Optional[str] = None
    metadata_json: Optional[str] = None


class ClinicalNotificationCreate(ClinicalNotificationBase):
    pass


class ClinicalNotificationReact(BaseModel):
    reaction_type: Literal[
        "on_my_way",
        "at_bedside",
        "dispensed",
        "in_progress",
        "acknowledged",
        "custom_reply",
    ]
    reaction_note: Optional[str] = Field(None, max_length=500)


class EmergencyBroadcastRequest(BaseModel):
    code_name: Literal[
        "CODE_BLUE",
        "CODE_RED",
        "MCI_ALERT",
        "BLACKOUT_ALERT",
        "RAPID_RESPONSE",
        "CRITICAL_ALERT",
    ]
    location: str = Field(..., description="e.g. 'Emergency Bay 2', 'ICU Bed 4', 'Ward 3'")
    details: str = Field(..., description="Actionable instructions for the clinical team")
    target_roles: List[str] = Field(default=["all"])
    department: Optional[str] = None


class ClinicalNotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    severity: str
    category: str
    sender_id: Optional[int] = None
    sender_name: str
    sender_role: str
    target_role: str
    target_user_id: Optional[int] = None
    department: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime
    is_read: bool
    reaction_type: Optional[str] = None
    reaction_note: Optional[str] = None
    reaction_by: Optional[str] = None
    reacted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedNotificationResponse(BaseModel):
    items: List[ClinicalNotificationResponse]
    total: int
    unread_count: int


class EventBusStatusResponse(BaseModel):
    active_websockets: int
    connected_roles: List[str]
    subscribed_channels: List[str]
    status: str = "operational"
