"""
push_service.py — Expo Push Notification delivery service for VaultGov AI.

Architecture:
    ExpoPushService wraps the Expo Push API v2.
    It sends push notifications, handles receipts, retries on transient failures,
    and clears invalid tokens from the users table.

    Endpoint: https://exp.host/--/expo-push/api/v2/push/send
    Batch size: up to 100 messages per request (Expo limit).

Key behaviours:
    • Retry on 5xx / network errors (3 attempts, exponential back-off: 1s, 2s, 4s)
    • On DeviceNotRegistered: clears expo_push_token from the user record
    • On InvalidCredentials: logs critical error but does not raise (never crash the scheduler)
    • Uses httpx (synchronous) — already in requirements.txt

Public API:
    send_push(token, title, body, data?)        — send one notification
    send_batch(messages)                        — send up to 100 at once
    dispatch_pending(db, notification_manager)  — batch-send all PENDING notifications
"""

import logging
import time
from typing import Any, Optional

import httpx
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

EXPO_PUSH_URL = "https://exp.host/--/expo-push/api/v2/push/send"
EXPO_PUSH_TIMEOUT = 10.0   # seconds
MAX_RETRIES = 3
BATCH_SIZE = 100            # Expo hard limit


# ── Types ─────────────────────────────────────────────────────────────────────

class PushMessage:
    """Represents a single Expo push message."""

    def __init__(
        self,
        to: str,
        title: str,
        body: str,
        data: Optional[dict[str, Any]] = None,
        sound: str = "default",
        badge: Optional[int] = None,
        priority: str = "default",
    ) -> None:
        self.to = to
        self.title = title
        self.body = body
        self.data = data or {}
        self.sound = sound
        self.badge = badge
        self.priority = priority  # default | normal | high

    def to_dict(self) -> dict[str, Any]:
        msg: dict[str, Any] = {
            "to": self.to,
            "title": self.title,
            "body": self.body,
            "data": self.data,
            "sound": self.sound,
            "priority": self.priority,
        }
        if self.badge is not None:
            msg["badge"] = self.badge
        return msg


# ── Service ───────────────────────────────────────────────────────────────────

class ExpoPushService:
    """
    Wraps the Expo Push Notification API v2.

    Methods are synchronous (using httpx) so they can safely run inside the
    background scheduler thread without introducing asyncio complexity.
    """

    def __init__(self) -> None:
        self._client = httpx.Client(
            timeout=EXPO_PUSH_TIMEOUT,
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
        )

    # ── Single push ───────────────────────────────────────────────────────────

    def send_push(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[dict[str, Any]] = None,
        priority: str = "default",
    ) -> dict[str, Any]:
        """
        Sends a single push notification.

        Args:
            token:    Expo push token (ExponentPushToken[...])
            title:    Notification headline
            body:     Notification body text
            data:     Optional data payload for deep linking
            priority: "default" | "normal" | "high"

        Returns:
            Expo API response for this message (status, id, details).

        Raises:
            RuntimeError: If all retries exhausted on a transient error.
        """
        msg = PushMessage(to=token, title=title, body=body, data=data, priority=priority)
        results = self.send_batch([msg])
        if results:
            return results[0]
        return {"status": "error", "message": "No response from Expo"}

    # ── Batch push ────────────────────────────────────────────────────────────

    def send_batch(
        self,
        messages: list[PushMessage],
    ) -> list[dict[str, Any]]:
        """
        Sends up to BATCH_SIZE messages in a single Expo API call.
        Automatically chunks if len(messages) > BATCH_SIZE.

        Args:
            messages: List of PushMessage instances (max 100 per Expo limit)

        Returns:
            Flat list of per-message result dicts from Expo.
        """
        results: list[dict[str, Any]] = []
        for i in range(0, len(messages), BATCH_SIZE):
            chunk = messages[i : i + BATCH_SIZE]
            chunk_results = self._send_chunk(chunk)
            results.extend(chunk_results)
        return results

    def _send_chunk(self, messages: list[PushMessage]) -> list[dict[str, Any]]:
        """Internal: sends one chunk of ≤ 100 messages with retry logic."""
        payload = [m.to_dict() for m in messages]
        last_error: Optional[Exception] = None

        for attempt in range(MAX_RETRIES):
            try:
                response = self._client.post(EXPO_PUSH_URL, json=payload)
                response.raise_for_status()
                data = response.json()
                results: list[dict] = data.get("data", [])
                logger.info(
                    "[PushService] Batch sent: %d messages, %d results",
                    len(messages),
                    len(results),
                )
                return results
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "[PushService] HTTP error (attempt %d/%d): %s",
                    attempt + 1,
                    MAX_RETRIES,
                    exc,
                )
                last_error = exc
                # 4xx are not transient — bail immediately
                if exc.response.status_code < 500:
                    break
            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                logger.warning(
                    "[PushService] Network error (attempt %d/%d): %s",
                    attempt + 1,
                    MAX_RETRIES,
                    exc,
                )
                last_error = exc

            # Exponential back-off: 1s, 2s, 4s
            wait = 2 ** attempt
            logger.info("[PushService] Retrying in %ds…", wait)
            time.sleep(wait)

        logger.error("[PushService] All retries exhausted: %s", last_error)
        # Return error stubs so callers can update delivery_status
        return [{"status": "error", "message": str(last_error)} for _ in messages]

    # ── High-level dispatcher ─────────────────────────────────────────────────

    def dispatch_pending(self, db: Session, notification_manager: Any) -> int:
        """
        Fetches all PENDING notifications, resolves Expo tokens from the users
        table, and sends push notifications in batches.

        Also handles:
            - Missing token (user never registered) → mark as SKIPPED
            - DeviceNotRegistered → clear token from user, mark FAILED
            - Successful delivery → mark SENT

        Args:
            db:                   SQLAlchemy session
            notification_manager: NotificationManager singleton

        Returns:
            Number of notifications successfully pushed.
        """
        pending = notification_manager.get_pending_push_notifications(db)
        if not pending:
            return 0

        # Build token map: user_id → expo_push_token
        user_ids = list({str(n.user_id) for n in pending})
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        token_map = {str(u.id): u.expo_push_token for u in users}

        messages: list[PushMessage] = []
        notif_index: list[Notification] = []  # parallel array to messages

        for notif in pending:
            token = token_map.get(str(notif.user_id))
            if not token:
                notification_manager.mark_push_failed(db, notif.id, "No push token registered")
                logger.debug(
                    "[PushService] Skipped (no token): notification %s", notif.id
                )
                continue

            # Map VaultGov priority to Expo priority
            expo_priority = (
                "high" if notif.priority in ("CRITICAL", "HIGH") else "default"
            )
            messages.append(
                PushMessage(
                    to=token,
                    title=notif.title,
                    body=notif.message,
                    data={
                        "notification_id": str(notif.id),
                        **(notif.payload or {}),
                    },
                    priority=expo_priority,
                )
            )
            notif_index.append(notif)

        if not messages:
            return 0

        results = self.send_batch(messages)
        pushed = 0

        for notif, result in zip(notif_index, results):
            status = result.get("status")
            if status == "ok":
                receipt_id = result.get("id")
                notification_manager.mark_push_sent(db, notif.id, receipt_id)
                pushed += 1
            else:
                error_details = result.get("details", {})
                error_type = error_details.get("error", "")
                error_msg = result.get("message", "Unknown push error")

                if error_type == "DeviceNotRegistered":
                    # Token is invalid — clear it from the user record
                    user = db.query(User).filter(User.id == notif.user_id).first()
                    if user:
                        user.expo_push_token = None
                        db.commit()
                        logger.warning(
                            "[PushService] Cleared invalid token for user %s", notif.user_id
                        )

                notification_manager.mark_push_failed(db, notif.id, error_msg)
                logger.error(
                    "[PushService] Push failed for notification %s: %s", notif.id, error_msg
                )

        logger.info("[PushService] dispatch_pending complete: %d/%d pushed", pushed, len(messages))
        return pushed

    def close(self) -> None:
        """Close the underlying httpx client."""
        self._client.close()


# ── Module-level singleton ────────────────────────────────────────────────────
push_service = ExpoPushService()
