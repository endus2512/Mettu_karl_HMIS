"""
Real-Time Clinical Event Bus, WebSocket Hub, and Notification Endpoints.
Enables sub-second clinical alerting for Code Blue resuscitations, critical lab panic values,
IoMT bedside breaches, and emergency multi-casualty triage directives.
"""
from datetime import datetime, timezone
import json
import logging
from typing import Annotated, Any, Dict, List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from jose import JWTError
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.core.security import decode_token
from app.models.notification import ClinicalNotification
from app.models.user import User, UserRole
from app.schemas.notification import (
    ClinicalNotificationCreate,
    ClinicalNotificationReact,
    ClinicalNotificationResponse,
    EmergencyBroadcastRequest,
    EventBusStatusResponse,
    PaginatedNotificationResponse,
)
from app.services.event_bus_service import clinical_event_bus

logger = logging.getLogger("mkh.events_api")

router = APIRouter()


@router.websocket("/ws")
async def websocket_event_hub(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    Live bidirectional WebSocket connection to the Hospital Real-Time Event Bus.
    Supports authenticated user registration, channel subscriptions, and ping/pong.
    """
    user_id: Optional[int] = None
    user_role: Optional[str] = None
    user_email: Optional[str] = None

    # Authenticate token if passed in query param
    if token:
        try:
            payload = decode_token(token)
            sub = payload.get("sub")
            if sub:
                user_id = int(sub) if str(sub).isdigit() else None
                user_email = str(sub) if not str(sub).isdigit() else None
            user_role = payload.get("role")
        except (JWTError, ValueError, Exception) as e:
            logger.warning(f"EventBus WebSocket: Invalid auth token: {e}")

    await clinical_event_bus.connect(
        websocket=websocket,
        user_id=user_id,
        role=user_role,
        channels=["broadcast"],
    )

    try:
        # Send initial connection handshake
        await websocket.send_text(
            json.dumps({
                "type": "CONNECTION_ESTABLISHED",
                "payload": {
                    "authenticated": user_id is not None or user_role is not None,
                    "user_id": user_id,
                    "role": user_role,
                    "channels": ["broadcast", f"role:{user_role}" if user_role else "anonymous"],
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        )

        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                msg_type = msg.get("type", "").upper()

                if msg_type == "PING":
                    await websocket.send_text(
                        json.dumps({
                            "type": "PONG",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })
                    )
                elif msg_type == "AUTH":
                    # Late auth handshake
                    t = msg.get("token")
                    if t:
                        try:
                            p = decode_token(t)
                            s = p.get("sub")
                            r = p.get("role")
                            uid = int(s) if str(s).isdigit() else None
                            # Reconnect with authenticated profile
                            await clinical_event_bus.disconnect(websocket)
                            await clinical_event_bus.connect(
                                websocket=websocket,
                                user_id=uid,
                                role=r,
                                channels=["broadcast"],
                            )
                            await websocket.send_text(
                                json.dumps({
                                    "type": "AUTH_SUCCESS",
                                    "role": r,
                                    "user_id": uid,
                                })
                            )
                        except Exception as auth_err:
                            await websocket.send_text(
                                json.dumps({
                                    "type": "AUTH_ERROR",
                                    "detail": str(auth_err),
                                })
                            )
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        await clinical_event_bus.disconnect(websocket)
    except Exception as e:
        logger.warning(f"EventBus WebSocket connection error: {e}")
        await clinical_event_bus.disconnect(websocket)


@router.get("/notifications", response_model=PaginatedNotificationResponse)
async def list_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False),
):
    """
    Fetch persistent clinical notifications and broadcasts applicable to the current user.
    Filtered by user ID or user role (e.g. Doctor, Nurse, Admin).
    """
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    # Filter where targeted to 'all', or matching user's role, or directly to user's ID
    filter_condition = or_(
        ClinicalNotification.target_role == "all",
        ClinicalNotification.target_role == role_str,
        ClinicalNotification.target_user_id == current_user.id,
    )

    query = select(ClinicalNotification).where(filter_condition)
    if unread_only:
        query = query.where(ClinicalNotification.is_read.is_(False))

    query = query.order_by(desc(ClinicalNotification.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    # Total count
    total_query = select(func.count(ClinicalNotification.id)).where(filter_condition)
    total_count = (await db.execute(total_query)).scalar_one()

    # Unread count
    unread_query = select(func.count(ClinicalNotification.id)).where(
        filter_condition,
        ClinicalNotification.is_read.is_(False),
    )
    unread_count = (await db.execute(unread_query)).scalar_one()

    return PaginatedNotificationResponse(
        items=[ClinicalNotificationResponse.model_validate(it) for it in items],
        total=total_count,
        unread_count=unread_count,
    )


@router.post("/notifications/broadcast", response_model=ClinicalNotificationResponse, status_code=status.HTTP_201_CREATED)
async def dispatch_emergency_broadcast(
    payload: EmergencyBroadcastRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Trigger a real-time hospital emergency broadcast or clinical alert.
    Persists to PostgreSQL and simultaneously pushes to all connected WebSockets.
    """
    # Build human-readable title and severity
    code_titles = {
        "CODE_BLUE": f"CODE BLUE: Medical Emergency at {payload.location}",
        "CODE_RED": f"CODE RED: Fire & Life Safety Alert at {payload.location}",
        "MCI_ALERT": f"MCI ALERT: Mass Casualty Incident at {payload.location}",
        "BLACKOUT_ALERT": f"POWER ALERT: Utility Outage & Generator Engaged at {payload.location}",
        "RAPID_RESPONSE": f"RAPID RESPONSE: Clinical Deterioration at {payload.location}",
        "CRITICAL_ALERT": f"CRITICAL CLINICAL ALERT: {payload.location}",
    }
    title = code_titles.get(payload.code_name, f"ALERT: {payload.code_name} at {payload.location}")
    severity = "emergency" if payload.code_name in ["CODE_BLUE", "CODE_RED", "MCI_ALERT"] else "critical"

    sender_name = current_user.full_name or current_user.username or current_user.email
    sender_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    target_role_str = payload.target_roles[0] if len(payload.target_roles) == 1 else "all"

    notification = ClinicalNotification(
        title=title,
        message=payload.details,
        severity=severity,
        category=payload.code_name.lower(),
        sender_id=current_user.id,
        sender_name=sender_name,
        sender_role=sender_role,
        target_role=target_role_str,
        department=payload.department or payload.location,
        is_read=False,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)

    # Real-time WebSocket push
    broadcast_data = {
        "id": notification.id,
        "code_name": payload.code_name,
        "title": title,
        "message": payload.details,
        "location": payload.location,
        "severity": severity,
        "sender_name": sender_name,
        "sender_role": sender_role,
        "timestamp": notification.created_at.isoformat(),
    }

    if "all" in payload.target_roles or target_role_str == "all":
        await clinical_event_bus.broadcast_to_all("EMERGENCY_BROADCAST", broadcast_data)
    else:
        await clinical_event_bus.broadcast_to_roles(payload.target_roles, "EMERGENCY_BROADCAST", broadcast_data)

    return ClinicalNotificationResponse.model_validate(notification)


@router.post("/notifications/{notification_id}/react", response_model=ClinicalNotificationResponse)
async def react_to_notification(
    notification_id: int,
    reaction_data: ClinicalNotificationReact,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Submit a 1-click clinical reaction (e.g. 'On My Way', 'At Bedside', 'Dispensed', 'Acknowledged').
    Broadcasts the reaction state over WebSocket to ensure all clinicians see response status.
    """
    stmt = select(ClinicalNotification).where(ClinicalNotification.id == notification_id)
    notif = (await db.execute(stmt)).scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    user_name = current_user.full_name or current_user.username or current_user.email

    notif.reaction_type = reaction_data.reaction_type
    notif.reaction_note = reaction_data.reaction_note
    notif.reaction_by = user_name
    notif.reacted_at = datetime.now(timezone.utc)
    notif.is_read = True

    await db.commit()
    await db.refresh(notif)

    # Broadcast reaction event
    reaction_event = {
        "notification_id": notif.id,
        "reaction_type": notif.reaction_type,
        "reaction_note": notif.reaction_note,
        "reaction_by": user_name,
        "responder_role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        "reacted_at": notif.reacted_at.isoformat(),
    }
    await clinical_event_bus.broadcast_to_all("CLINICAL_REACTION", reaction_event)

    return ClinicalNotificationResponse.model_validate(notif)


@router.post("/notifications/{notification_id}/read", response_model=ClinicalNotificationResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark a notification as read."""
    stmt = select(ClinicalNotification).where(ClinicalNotification.id == notification_id)
    notif = (await db.execute(stmt)).scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return ClinicalNotificationResponse.model_validate(notif)


@router.post("/notifications/clear-all")
async def clear_all_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark all relevant notifications as read for current user."""
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    filter_condition = or_(
        ClinicalNotification.target_role == "all",
        ClinicalNotification.target_role == role_str,
        ClinicalNotification.target_user_id == current_user.id,
    )
    stmt = select(ClinicalNotification).where(filter_condition, ClinicalNotification.is_read.is_(False))
    result = await db.execute(stmt)
    notifications_list = result.scalars().all()

    for n in notifications_list:
        n.is_read = True

    await db.commit()
    return {"message": "All notifications marked as read", "count": len(notifications_list)}


@router.get("/active-status", response_model=EventBusStatusResponse)
async def get_event_bus_status():
    """Diagnostic telemetry on active WebSocket connections and subscribers."""
    return EventBusStatusResponse(**clinical_event_bus.get_status())
