"""
notification.py — ORM model for the `notifications` table.

Columns:
    id              — UUID primary key
    user_id         — FK to users (CASCADE DELETE)
    document_id     — optional FK to documents (CASCADE DELETE)
    type            — event type e.g. EXPIRY_90D, UPLOAD_SUCCESS, SCHEME_ELIGIBLE
    category        — high-level grouping: DOCUMENT, SCHEME, SECURITY, AI, UPLOAD, SUMMARY
    priority        — CRITICAL | HIGH | MEDIUM | LOW
    title           — short notification headline (≤ 255 chars)
    message         — full notification body
    metadata        — JSONB blob for deep-link hints, scheme_id, extra context
    is_read         — user has opened/dismissed this notification
    sent_at         — when push was attempted
    read_at         — when user marked it read
    expires_at      — optional TTL; soft-expired items hidden from UI
    delivery_status — PENDING | SENT | FAILED | SKIPPED
    push_sent       — whether Expo push was successfully dispatched
    push_error      — last push error message (for diagnostics)
    created_at      — record creation timestamp (UTC)
    updated_at      — last mutation timestamp (UTC)
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database.connection import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Notification(Base):
    """ORM model for the `notifications` table."""

    __tablename__ = "notifications"

    # ── Primary key ──────────────────────────────────────────────────────────
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # ── Ownership ─────────────────────────────────────────────────────────────
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ── Classification ────────────────────────────────────────────────────────
    type = Column(String(80), nullable=False)
    """
    Event type constants (non-exhaustive):
      EXPIRY_90D, EXPIRY_60D, EXPIRY_30D, EXPIRY_15D, EXPIRY_7D,
      EXPIRY_3D, EXPIRY_1D, EXPIRED, EXPIRY_OVERDUE,
      DOC_HEALTH_BLURRY, DOC_HEALTH_LOW_OCR, DOC_HEALTH_DUPLICATE,
      DOC_HEALTH_CROPPED, DOC_HEALTH_MISSING_EXPIRY, DOC_HEALTH_FAILED,
      UPLOAD_STARTED, UPLOAD_SUCCESS, OCR_COMPLETE, EXTRACTION_COMPLETE,
      PROCESSING_FAILED,
      SCHEME_ELIGIBLE, SCHEME_DEADLINE, SCHEME_APPROVED, SCHEME_REJECTED,
      SCHEME_MISSING_DOC, SCHEME_UPDATED,
      SECURITY_NEW_LOGIN, SECURITY_PASSWORD_CHANGED, SECURITY_DEVICE_CHANGED,
      BACKUP_COMPLETE, BACKUP_FAILED,
      AI_RECOMMENDATION, AI_HEALTH_IMPROVED, AI_DUPLICATE_FOUND,
      AI_UNUSED_DOC, AI_PROFILE_SUGGESTION,
      WEEKLY_SUMMARY, MONTHLY_REPORT
    """

    category = Column(String(50), nullable=False, default="GENERAL")
    """
    Grouping for UI filtering: DOCUMENT | SCHEME | SECURITY | AI | UPLOAD | SUMMARY | GENERAL
    """

    priority = Column(String(20), nullable=False, default="LOW")
    """CRITICAL | HIGH | MEDIUM | LOW"""

    # ── Content ───────────────────────────────────────────────────────────────
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    payload = Column(JSONB, nullable=True, default=dict)
    """
    Free-form JSON for deep-link hints, e.g.:
      {"document_id": "...", "screen": "DocumentDetail"}
      {"scheme_id": "...", "screen": "SchemeDetail"}
    """

    # ── State ─────────────────────────────────────────────────────────────────
    is_read = Column(Boolean, nullable=False, default=False)
    delivery_status = Column(String(20), nullable=False, default="PENDING")
    """PENDING | SENT | FAILED | SKIPPED"""

    push_sent = Column(Boolean, nullable=False, default=False)
    push_error = Column(String(500), nullable=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    sent_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=_now,
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=_now,
        onupdate=_now,
    )

    # ── Composite index for the main list query ───────────────────────────────
    __table_args__ = (
        Index(
            "ix_notifications_user_read_created",
            "user_id",
            "is_read",
            "created_at",
        ),
    )
