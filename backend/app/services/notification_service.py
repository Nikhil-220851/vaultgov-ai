"""
notification_service.py — Data-access layer for the Notification resource.

Architecture:
    NotificationManager owns all DB-level CRUD for notifications.
    It is the only module that writes to the notifications table outside of
    NotificationEngine (which creates rows) and PushService (which updates
    push_sent / push_error columns).

    API endpoints in api/notifications.py call NotificationManager exclusively.
    They never query the database directly.

Public API:
    get_notifications(...)      — paginated list for a user
    get_unread_count(...)       — integer badge count
    mark_read(...)              — mark single notification as read
    mark_all_read(...)          — bulk mark-read for a user
    delete_notification(...)    — hard delete single notification
    clear_all(...)              — bulk delete all notifications for a user
    register_push_token(...)    — store Expo push token on user record
    get_pending_push(...)       — fetch PENDING notifications for push dispatch
    mark_push_sent(...)         — update delivery_status after push
    mark_push_failed(...)       — record push failure
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger(__name__)


class NotificationManager:
    """
    Data-access layer for the notifications table.

    All methods accept user_id as a UUID to enforce ownership isolation.
    No method returns another user's notifications.
    """

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_notifications(
        self,
        db: Session,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
        category: Optional[str] = None,
        unread_only: bool = False,
    ) -> dict:
        """
        Returns a paginated list of notifications for a user.

        Args:
            db:          SQLAlchemy session
            user_id:     Target user UUID (ownership enforced)
            page:        1-based page number
            page_size:   Items per page (max 50)
            category:    Optional filter: DOCUMENT | SCHEME | SECURITY | AI | UPLOAD | SUMMARY
            unread_only: If True, only return unread notifications

        Returns:
            Dict with keys: items, total, page, page_size, has_more
        """
        page_size = min(page_size, 50)
        offset = (page - 1) * page_size

        query = db.query(Notification).filter(Notification.user_id == user_id)

        if category:
            query = query.filter(Notification.category == category.upper())

        if unread_only:
            query = query.filter(Notification.is_read == False)

        # Exclude expired notifications
        now = datetime.now(timezone.utc)
        query = query.filter(
            (Notification.expires_at == None) | (Notification.expires_at > now)
        )

        total = query.count()
        items = (
            query.order_by(desc(Notification.created_at))
            .offset(offset)
            .limit(page_size)
            .all()
        )

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (offset + len(items)) < total,
        }

    def get_unread_count(self, db: Session, user_id: UUID) -> int:
        """
        Returns the unread notification count for the badge indicator.

        Args:
            db:      SQLAlchemy session
            user_id: Target user UUID

        Returns:
            Integer count of unread, non-expired notifications.
        """
        now = datetime.now(timezone.utc)
        return (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == False,
                (Notification.expires_at == None) | (Notification.expires_at > now),
            )
            .count()
        )

    # ── Write — Read state ────────────────────────────────────────────────────

    def mark_read(
        self,
        db: Session,
        user_id: UUID,
        notification_id: UUID,
    ) -> Optional[Notification]:
        """
        Marks a single notification as read and records the read timestamp.

        Args:
            db:              SQLAlchemy session
            user_id:         Requesting user UUID (ownership check)
            notification_id: UUID of the notification to mark read

        Returns:
            Updated Notification, or None if not found / not owned by user.
        """
        notif = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
            .first()
        )
        if not notif:
            return None

        if not notif.is_read:
            notif.is_read = True
            notif.read_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notif)
            logger.info("[NotificationManager] Marked read: %s", notification_id)

        return notif

    def mark_all_read(self, db: Session, user_id: UUID) -> int:
        """
        Bulk marks all unread notifications as read for a user.

        Returns:
            Number of rows updated.
        """
        now = datetime.now(timezone.utc)
        updated = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .all()
        )
        count = 0
        for notif in updated:
            notif.is_read = True
            notif.read_at = now
            count += 1

        db.commit()
        logger.info("[NotificationManager] Marked all read for user %s: %d rows", user_id, count)
        return count

    # ── Write — Delete ────────────────────────────────────────────────────────

    def delete_notification(
        self,
        db: Session,
        user_id: UUID,
        notification_id: UUID,
    ) -> bool:
        """
        Hard-deletes a single notification (ownership enforced).

        Returns:
            True if deleted, False if not found.
        """
        notif = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
            .first()
        )
        if not notif:
            return False

        db.delete(notif)
        db.commit()
        logger.info("[NotificationManager] Deleted notification: %s", notification_id)
        return True

    def clear_all(self, db: Session, user_id: UUID) -> int:
        """
        Hard-deletes ALL notifications for a user.

        Returns:
            Number of rows deleted.
        """
        notifications = (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .all()
        )
        count = len(notifications)
        for notif in notifications:
            db.delete(notif)
        db.commit()
        logger.info("[NotificationManager] Cleared all notifications for user %s: %d rows", user_id, count)
        return count

    # ── Push Token ────────────────────────────────────────────────────────────

    def register_push_token(
        self,
        db: Session,
        user_id: UUID,
        token: str,
    ) -> bool:
        """
        Stores or updates the Expo push notification token for a user.

        Args:
            db:      SQLAlchemy session
            user_id: Target user UUID
            token:   Expo push token string (e.g. "ExponentPushToken[xxxxxx]")

        Returns:
            True if token was updated, False if user not found.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning("[NotificationManager] register_push_token: user %s not found", user_id)
            return False

        if user.expo_push_token != token:
            user.expo_push_token = token
            db.commit()
            logger.info("[NotificationManager] Push token registered for user %s", user_id)
        return True

    # ── Push dispatch helpers ──────────────────────────────────────────────────

    def get_pending_push_notifications(
        self,
        db: Session,
        limit: int = 100,
    ) -> list[Notification]:
        """
        Fetches up to `limit` PENDING notifications that have not yet had
        push delivery attempted. Used by PushService to dispatch pushes.

        Args:
            db:    SQLAlchemy session
            limit: Maximum number of rows to return (Expo batch limit is 100)

        Returns:
            List of Notification instances.
        """
        return (
            db.query(Notification)
            .filter(
                Notification.delivery_status == "PENDING",
                Notification.push_sent == False,
            )
            .order_by(Notification.created_at)
            .limit(limit)
            .all()
        )

    def mark_push_sent(
        self,
        db: Session,
        notification_id: UUID,
        receipt_id: Optional[str] = None,
    ) -> None:
        """Updates delivery_status to SENT after a successful push dispatch."""
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if notif:
            notif.push_sent = True
            notif.delivery_status = "SENT"
            notif.sent_at = datetime.now(timezone.utc)
            if receipt_id:
                notif.payload = {**(notif.payload or {}), "expo_receipt_id": receipt_id}
            db.commit()

    def mark_push_failed(
        self,
        db: Session,
        notification_id: UUID,
        error: str,
    ) -> None:
        """Updates delivery_status to FAILED and records the error message."""
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if notif:
            notif.push_sent = False
            notif.delivery_status = "FAILED"
            notif.push_error = error[:500]  # Truncate to column limit
            db.commit()


# ── Module-level singleton ────────────────────────────────────────────────────
notification_manager = NotificationManager()
