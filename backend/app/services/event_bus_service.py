"""
Mettu Karl Referral Hospital — Real-Time WebSocket Clinical Event Bus.
Manages concurrent WebSocket streams, clinical channels, emergency broadcasts (Code Blue),
and role-targeted push alerts with sub-second latency.
"""
import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional, Set
from fastapi import WebSocket

logger = logging.getLogger("mkh.event_bus")


class ClinicalEventBus:
    """
    Centralized event hub supporting pub/sub channels, role filtering,
    direct user messaging, and hospital-wide emergency broadcasts.
    """

    def __init__(self) -> None:
        self.all_connections: Set[WebSocket] = set()
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        self.role_connections: Dict[str, Set[WebSocket]] = {}
        self.channel_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(
        self,
        websocket: WebSocket,
        user_id: Optional[int] = None,
        role: Optional[str] = None,
        channels: Optional[List[str]] = None,
    ) -> None:
        """Register an authenticated WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self.all_connections.add(websocket)

            if user_id is not None:
                if user_id not in self.user_connections:
                    self.user_connections[user_id] = set()
                self.user_connections[user_id].add(websocket)

            if role:
                clean_role = role.strip().lower()
                if clean_role not in self.role_connections:
                    self.role_connections[clean_role] = set()
                self.role_connections[clean_role].add(websocket)

            # Default channels subscribed
            active_channels = set(channels or [])
            active_channels.add("broadcast")
            if role:
                active_channels.add(f"role:{role.strip().lower()}")

            for ch in active_channels:
                if ch not in self.channel_connections:
                    self.channel_connections[ch] = set()
                self.channel_connections[ch].add(websocket)

        logger.info(
            f"EventBus: Client connected (user_id={user_id}, role={role}, total={len(self.all_connections)})"
        )

    async def disconnect(self, websocket: WebSocket) -> None:
        """Unregister a disconnected WebSocket across all maps."""
        async with self._lock:
            self.all_connections.discard(websocket)

            for user_ws_set in self.user_connections.values():
                user_ws_set.discard(websocket)

            for role_ws_set in self.role_connections.values():
                role_ws_set.discard(websocket)

            for ch_ws_set in self.channel_connections.values():
                ch_ws_set.discard(websocket)

        logger.info(f"EventBus: Client disconnected. Active total={len(self.all_connections)}")

    async def _safe_send(self, ws: WebSocket, payload: str, dead_sockets: Set[WebSocket]) -> None:
        try:
            await ws.send_text(payload)
        except Exception as e:
            logger.warning(f"EventBus: Error sending to WebSocket: {e}")
            dead_sockets.add(ws)

    async def broadcast_to_all(self, event_type: str, payload: Dict[str, Any]) -> int:
        """Broadcast an event to every connected clinical workstation."""
        message = json.dumps({
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        async with self._lock:
            targets = list(self.all_connections)

        dead_sockets: Set[WebSocket] = set()
        for ws in targets:
            await self._safe_send(ws, message, dead_sockets)

        if dead_sockets:
            for dws in dead_sockets:
                await self.disconnect(dws)

        return len(targets) - len(dead_sockets)

    async def broadcast_to_roles(self, roles: List[str], event_type: str, payload: Dict[str, Any]) -> int:
        """Deliver event to clients matching specific staff roles (e.g. ['doctor', 'nurse'])."""
        message = json.dumps({
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        targets: Set[WebSocket] = set()
        async with self._lock:
            for r in roles:
                clean_role = r.strip().lower()
                if clean_role == "all":
                    targets.update(self.all_connections)
                elif clean_role in self.role_connections:
                    targets.update(self.role_connections[clean_role])

        dead_sockets: Set[WebSocket] = set()
        for ws in targets:
            await self._safe_send(ws, message, dead_sockets)

        if dead_sockets:
            for dws in dead_sockets:
                await self.disconnect(dws)

        return len(targets) - len(dead_sockets)

    async def broadcast_to_channel(self, channel: str, event_type: str, payload: Dict[str, Any]) -> int:
        """Publish event to a specific topic channel."""
        message = json.dumps({
            "type": event_type,
            "channel": channel,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        async with self._lock:
            targets = list(self.channel_connections.get(channel, []))

        dead_sockets: Set[WebSocket] = set()
        for ws in targets:
            await self._safe_send(ws, message, dead_sockets)

        if dead_sockets:
            for dws in dead_sockets:
                await self.disconnect(dws)

        return len(targets) - len(dead_sockets)

    async def send_to_user(self, user_id: int, event_type: str, payload: Dict[str, Any]) -> int:
        """Deliver targeted notification directly to an individual user."""
        message = json.dumps({
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        async with self._lock:
            targets = list(self.user_connections.get(user_id, []))

        dead_sockets: Set[WebSocket] = set()
        for ws in targets:
            await self._safe_send(ws, message, dead_sockets)

        if dead_sockets:
            for dws in dead_sockets:
                await self.disconnect(dws)

        return len(targets) - len(dead_sockets)

    def get_status(self) -> Dict[str, Any]:
        """Telemetry diagnostics on active event bus connections."""
        active_roles = [r for r, s in self.role_connections.items() if len(s) > 0]
        active_channels = [c for c, s in self.channel_connections.items() if len(s) > 0]
        return {
            "active_websockets": len(self.all_connections),
            "connected_roles": active_roles,
            "subscribed_channels": active_channels,
            "status": "operational",
        }


# Global singleton instance
clinical_event_bus = ClinicalEventBus()
