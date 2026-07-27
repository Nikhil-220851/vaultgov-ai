"""
notification_engine.py — Event-driven notification generation for VaultGov AI.

Architecture:
    NotificationEngine is a pure business logic class.
    It reads from the database, generates Notification rows, and writes them back.
    It does NOT send pushes — that is the responsibility of push_service.py.
    It uses notification_utils.py for deduplication and message formatting.

All methods are idempotent: calling them twice on the same day will not
produce duplicate rows (enforced via dedup key check + 24-hour cutoff).

Public API:
    create_notification(...)             — low-level single record creator
    generate_expiry_notifications(db)    — daily: all 9 expiry milestones
    generate_document_health_notifications(db) — daily: health issues scan
    generate_upload_notification(...)    — on-demand: upload lifecycle events
    generate_scheme_notification(...)    — on-demand: scheme events
    generate_security_notification(...)  — on-demand: security events
    generate_ai_notifications(db)        — daily: AI-driven suggestions
    generate_weekly_summary(db)          — weekly: vault summary per user
    generate_monthly_report(db)          — monthly: AI health report per user
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.notification import Notification
from app.models.user import User
from app.services.notification_utils import (
    EXPIRY_MILESTONES,
    build_dedup_key,
    format_expiry_message,
    format_health_message,
    format_upload_message,
    get_category_and_priority,
)

logger = logging.getLogger(__name__)


class NotificationEngine:
    """
    Generates Notification records in response to system events.

    Deduplication strategy:
        Before inserting, we compute a deterministic key from
        (user_id, type, document_id, today_utc) and check whether
        a matching record was created in the last 24 hours.
        If one exists, we log and skip — never raise.
    """

    # ── Low-level creator ─────────────────────────────────────────────────────

    def create_notification(
        self,
        db: Session,
        user_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        *,
        document_id: Optional[UUID] = None,
        payload: Optional[dict[str, Any]] = None,
        expires_at: Optional[datetime] = None,
        commit: bool = True,
    ) -> Optional[Notification]:
        """
        Creates a single notification row with full deduplication.

        Args:
            db:                SQLAlchemy session
            user_id:           Target user UUID
            notification_type: Type constant e.g. "EXPIRY_7D"
            title:             Notification headline
            message:           Full notification body
            document_id:       Optional linked document UUID
            payload:          Optional JSONB payload for deep-link hints
            expires_at:        Optional UTC datetime after which to hide the notification
            commit:            Whether to commit the session immediately (default True).
                               Pass False when creating multiple notifications in a batch
                               to let the caller do a single commit.

        Returns:
            The created Notification instance, or None if a duplicate was found.
        """
        category, priority = get_category_and_priority(notification_type)

        # Deduplication: reject if same (user, type, doc) already created today
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.type == notification_type,
                Notification.document_id == document_id,
                Notification.created_at >= cutoff,
            )
            .first()
        )
        if existing:
            logger.debug(
                "[NotificationEngine] Duplicate ignored: type=%s user=%s doc=%s",
                notification_type,
                user_id,
                document_id,
            )
            return None

        notif = Notification(
            user_id=user_id,
            document_id=document_id,
            type=notification_type,
            category=category,
            priority=priority,
            title=title,
            message=message,
            payload=payload or {},
            expires_at=expires_at,
            is_read=False,
            delivery_status="PENDING",
            push_sent=False,
        )
        db.add(notif)

        if commit:
            db.commit()
            db.refresh(notif)

        logger.info(
            "[NotificationEngine] Created: type=%s user=%s priority=%s",
            notification_type,
            user_id,
            priority,
        )
        return notif

    # ── Document Expiry ───────────────────────────────────────────────────────

    def generate_expiry_notifications(self, db: Session) -> int:
        """
        Daily job: generates expiry milestone notifications for all documents
        that support expiry and have notifications enabled.

        Milestones: 90d, 60d, 30d, 15d, 7d, 3d, 1d, 0d (expired today),
                    and overdue (< 0 days).

        Returns:
            Count of notifications created (excluding duplicates).
        """
        now = datetime.now(timezone.utc)
        created_count = 0

        docs = (
            db.query(Document)
            .filter(
                Document.supports_expiry == True,
                Document.expiry_date.isnot(None),
                Document.notification_enabled == True,
            )
            .all()
        )

        for doc in docs:
            expiry = doc.expiry_date
            # Normalise to UTC-aware if stored as naive
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)

            delta_days = (expiry.date() - now.date()).days

            # Determine milestone
            notif_type: Optional[str] = EXPIRY_MILESTONES.get(delta_days)
            if notif_type is None:
                # Handle overdue (any negative day, but only once per 24h due to dedup)
                if delta_days < 0:
                    notif_type = "EXPIRY_OVERDUE"
                else:
                    continue  # Not a milestone day

            title, message = format_expiry_message(doc.title, delta_days)
            metadata = {
                "document_id": str(doc.id),
                "screen": "DocumentDetail",
                "days_left": delta_days,
            }

            result = self.create_notification(
                db,
                user_id=doc.user_id,
                notification_type=notif_type,
                title=title,
                message=message,
                document_id=doc.id,
                payload=metadata,
                commit=False,
            )
            if result:
                created_count += 1

        try:
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error("[NotificationEngine] Expiry batch commit failed: %s", exc)
            return 0

        logger.info(
            "[NotificationEngine] generate_expiry_notifications done: %d created", created_count
        )
        return created_count

    # ── Document Health ───────────────────────────────────────────────────────

    def generate_document_health_notifications(self, db: Session) -> int:
        """
        Daily job: scans all documents and generates health-related notifications
        when AI-detectable issues are present.

        Issues detected:
            - Low confidence score (< 0.6) → low_ocr
            - health_score < 0.5 → blurry / general health issue
            - Missing expiry date on expiry-supported doc → missing_expiry

        Returns:
            Count of notifications created.
        """
        created_count = 0
        docs = db.query(Document).all()

        for doc in docs:
            issues: list[tuple[str, str]] = []  # [(issue_key, notif_type), ...]

            # Low OCR confidence
            if doc.confidence_score is not None and doc.confidence_score < 0.60:
                issues.append(("low_ocr", "DOC_HEALTH_LOW_OCR"))

            # Poor health score
            if doc.health_score is not None and doc.health_score < 50.0:
                issues.append(("blurry", "DOC_HEALTH_BLURRY"))

            # Missing expiry date on expiry-supporting document
            if doc.supports_expiry and not doc.expiry_date:
                issues.append(("missing_expiry", "DOC_HEALTH_MISSING_EXPIRY"))

            for issue_key, notif_type in issues:
                title, message = format_health_message(doc.title, issue_key)
                result = self.create_notification(
                    db,
                    user_id=doc.user_id,
                    notification_type=notif_type,
                    title=title,
                    message=message,
                    document_id=doc.id,
                    payload={"document_id": str(doc.id), "screen": "DocumentDetail"},
                    commit=False,
                )
                if result:
                    created_count += 1

        try:
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error("[NotificationEngine] Health batch commit failed: %s", exc)
            return 0

        logger.info(
            "[NotificationEngine] generate_document_health_notifications done: %d created",
            created_count,
        )
        return created_count

    # ── Upload Lifecycle ──────────────────────────────────────────────────────

    def generate_upload_notification(
        self,
        db: Session,
        user_id: UUID,
        document_id: Optional[UUID],
        stage: str,
        doc_title: str = "Document",
    ) -> Optional[Notification]:
        """
        On-demand: called by the upload pipeline at each processing stage.

        Args:
            db:          SQLAlchemy session
            user_id:     Target user UUID
            document_id: UUID of the document being processed (may be None for failed uploads)
            stage:       One of: started | success | ocr_complete | extraction_complete | failed
            doc_title:   Human-readable document name for the message body

        Returns:
            Created Notification or None if duplicate.
        """
        stage_to_type = {
            "started":             "UPLOAD_STARTED",
            "success":             "UPLOAD_SUCCESS",
            "ocr_complete":        "OCR_COMPLETE",
            "extraction_complete": "EXTRACTION_COMPLETE",
            "failed":              "PROCESSING_FAILED",
        }
        notif_type = stage_to_type.get(stage, "UPLOAD_STARTED")
        title, message = format_upload_message(doc_title, stage)

        notif = self.create_notification(
            db,
            user_id=user_id,
            notification_type=notif_type,
            title=title,
            message=message,
            document_id=document_id,
            payload={
                "document_id": str(document_id) if document_id else None,
                "screen": "DocumentDetail",
                "stage": stage,
            },
        )
        if notif:
            logger.info(f"[Notification] Upload notification created for user {user_id}")
        return notif

    def generate_delete_notification(
        self,
        db: Session,
        user_id: UUID,
        doc_title: str = "Document",
    ) -> Optional[Notification]:
        """
        On-demand: called after a document is successfully deleted.

        Args:
            db:          SQLAlchemy session
            user_id:     Target user UUID
            doc_title:   Human-readable document name for the message body

        Returns:
            Created Notification or None if duplicate.
        """
        title = "Document deleted"
        message = f"Your {doc_title} has been removed from VaultGov AI."

        notif = self.create_notification(
            db,
            user_id=user_id,
            notification_type="DOCUMENT_DELETED",
            title=title,
            message=message,
            document_id=None,
            payload={
                "screen": "Home",
            },
        )
        if notif:
            logger.info(f"[Notification] Delete notification created for user {user_id}")
        return notif

    # ── Government Schemes ────────────────────────────────────────────────────

    def generate_scheme_notification(
        self,
        db: Session,
        user_id: UUID,
        scheme_id: str,
        scheme_title: str,
        event: str,
        extra_message: Optional[str] = None,
    ) -> Optional[Notification]:
        """
        On-demand: called when a scheme-related event occurs for a user.

        Args:
            db:            SQLAlchemy session
            user_id:       Target user UUID
            scheme_id:     Scheme identifier string
            scheme_title:  Human-readable scheme name
            event:         One of: eligible | deadline | approved | rejected |
                                   missing_doc | updated
            extra_message: Optional override for the notification body.

        Returns:
            Created Notification or None if duplicate.
        """
        event_map = {
            "eligible": (
                "SCHEME_ELIGIBLE",
                f"You May Be Eligible for {scheme_title}",
                f"Based on your profile and documents, you may qualify for {scheme_title}. Check now.",
            ),
            "deadline": (
                "SCHEME_DEADLINE",
                f"Deadline Approaching: {scheme_title}",
                f"The application deadline for {scheme_title} is approaching. Apply before it closes.",
            ),
            "approved": (
                "SCHEME_APPROVED",
                f"Application Approved: {scheme_title}",
                f"Your application for {scheme_title} has been approved. Congratulations!",
            ),
            "rejected": (
                "SCHEME_REJECTED",
                f"Application Rejected: {scheme_title}",
                f"Your application for {scheme_title} was not approved. Review the eligibility criteria.",
            ),
            "missing_doc": (
                "SCHEME_MISSING_DOC",
                f"Document Required: {scheme_title}",
                f"A required document is missing for your {scheme_title} application. Please upload it.",
            ),
            "updated": (
                "SCHEME_UPDATED",
                f"Scheme Updated: {scheme_title}",
                f"{scheme_title} has been updated with new information. Review the latest details.",
            ),
        }
        notif_type, title, default_message = event_map.get(
            event,
            ("SCHEME_UPDATED", f"Scheme Update: {scheme_title}", f"{scheme_title} has been updated."),
        )

        return self.create_notification(
            db,
            user_id=user_id,
            notification_type=notif_type,
            title=title,
            message=extra_message or default_message,
            payload={"scheme_id": scheme_id, "screen": "SchemeDetail"},
        )

    # ── Security Events ───────────────────────────────────────────────────────

    def generate_security_notification(
        self,
        db: Session,
        user_id: UUID,
        event: str,
        extra_payload: Optional[dict[str, Any]] = None,
    ) -> Optional[Notification]:
        """
        On-demand: called when a security-relevant event occurs.

        Args:
            db:             SQLAlchemy session
            user_id:        Target user UUID
            event:          One of: new_login | password_changed | device_changed |
                                    backup_complete | backup_failed
            extra_payload: Optional metadata dict merged into the notification payload.

        Returns:
            Created Notification or None if duplicate.
        """
        event_map = {
            "new_login": (
                "SECURITY_NEW_LOGIN",
                "New Sign-In Detected",
                "A new sign-in to your VaultGov account was detected. If this wasn't you, secure your account immediately.",
            ),
            "password_changed": (
                "SECURITY_PASSWORD_CHANGED",
                "Password Changed",
                "Your VaultGov account password was changed successfully.",
            ),
            "device_changed": (
                "SECURITY_DEVICE_CHANGED",
                "New Device Linked",
                "Your account was accessed from a new device. Review your security settings if this wasn't you.",
            ),
            "backup_complete": (
                "BACKUP_COMPLETE",
                "Vault Backup Complete",
                "Your vault data has been securely backed up.",
            ),
            "backup_failed": (
                "BACKUP_FAILED",
                "Vault Backup Failed",
                "We were unable to back up your vault. Please check your connection and try again.",
            ),
        }
        notif_type, title, message = event_map.get(
            event,
            ("SECURITY_NEW_LOGIN", "Security Alert", "A security event occurred on your account."),
        )

        metadata = {"screen": "Security", **(extra_payload or {})}

        return self.create_notification(
            db,
            user_id=user_id,
            notification_type=notif_type,
            title=title,
            message=message,
            payload=metadata,
        )

    # ── Smart AI Notifications ────────────────────────────────────────────────

    def generate_ai_notifications(self, db: Session) -> int:
        """
        Daily job: scans user vaults and generates AI-driven suggestions.

        Current heuristics:
            - Document health improved (health_score jumped since last check)
            - Profile completion suggestion (profile_completed = False)

        Returns:
            Count of notifications created.
        """
        created_count = 0
        users = db.query(User).all()

        for user in users:
            # Profile completion nudge (once per day max — dedup handles it)
            if not user.profile_completed:
                result = self.create_notification(
                    db,
                    user_id=user.id,
                    notification_type="AI_PROFILE_SUGGESTION",
                    title="Complete Your Profile",
                    message=(
                        "A complete profile helps us match you with more government schemes. "
                        "It only takes 2 minutes."
                    ),
                    payload={"screen": "CompleteProfile"},
                    commit=False,
                )
                if result:
                    created_count += 1

        try:
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error("[NotificationEngine] AI batch commit failed: %s", exc)
            return 0

        logger.info(
            "[NotificationEngine] generate_ai_notifications done: %d created", created_count
        )
        return created_count

    # ── Weekly Summary ────────────────────────────────────────────────────────

    def generate_weekly_summary(self, db: Session) -> int:
        """
        Weekly job (Sunday): generates a vault summary notification for every user
        that has at least one document.

        Returns:
            Count of notifications created.
        """
        now = datetime.now(timezone.utc)
        created_count = 0
        users = db.query(User).all()

        for user in users:
            docs = (
                db.query(Document)
                .filter(Document.user_id == user.id)
                .all()
            )
            if not docs:
                continue

            total = len(docs)
            expiring_soon = sum(
                1
                for d in docs
                if d.expiry_date and (d.expiry_date.replace(tzinfo=timezone.utc) - now).days <= 30
                and (d.expiry_date.replace(tzinfo=timezone.utc) - now).days >= 0
            )
            health_scores = [d.health_score for d in docs if d.health_score is not None]
            avg_health = (
                round(sum(health_scores) / len(health_scores))
                if health_scores
                else 0
            )

            message = (
                f"Your vault has {total} document{'s' if total != 1 else ''}. "
                f"{expiring_soon} expiring soon. "
                f"Overall health score: {avg_health}%."
            )

            result = self.create_notification(
                db,
                user_id=user.id,
                notification_type="WEEKLY_SUMMARY",
                title="Your Weekly Vault Summary",
                message=message,
                payload={
                    "total_docs": total,
                    "expiring_soon": expiring_soon,
                    "health_score": avg_health,
                    "screen": "Home",
                },
                commit=False,
            )
            if result:
                created_count += 1

        try:
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error("[NotificationEngine] Weekly summary commit failed: %s", exc)
            return 0

        logger.info(
            "[NotificationEngine] generate_weekly_summary done: %d created", created_count
        )
        return created_count

    # ── Monthly Report ────────────────────────────────────────────────────────

    def generate_monthly_report(self, db: Session) -> int:
        """
        Monthly job (1st of month): generates an AI health report per user.

        Returns:
            Count of notifications created.
        """
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        created_count = 0
        users = db.query(User).all()

        for user in users:
            docs = (
                db.query(Document)
                .filter(Document.user_id == user.id)
                .all()
            )

            total = len(docs)
            added_this_month = sum(
                1
                for d in docs
                if d.created_at and d.created_at >= month_start
            )
            expired_this_month = sum(
                1
                for d in docs
                if d.expiry_date
                and d.expiry_date.replace(tzinfo=timezone.utc) >= month_start
                and d.expiry_date.replace(tzinfo=timezone.utc) <= now
            )
            health_scores = [d.health_score for d in docs if d.health_score is not None]
            avg_health = (
                round(sum(health_scores) / len(health_scores))
                if health_scores
                else 0
            )

            month_name = month_start.strftime("%B %Y")
            message = (
                f"{month_name} Report: {total} total documents, "
                f"{added_this_month} added this month, "
                f"{expired_this_month} expired. "
                f"Average health score: {avg_health}%."
            )

            result = self.create_notification(
                db,
                user_id=user.id,
                notification_type="MONTHLY_REPORT",
                title=f"Your {month_name} AI Report",
                message=message,
                payload={
                    "total_docs": total,
                    "added_this_month": added_this_month,
                    "expired_this_month": expired_this_month,
                    "health_score": avg_health,
                    "screen": "Home",
                },
                commit=False,
            )
            if result:
                created_count += 1

        try:
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error("[NotificationEngine] Monthly report commit failed: %s", exc)
            return 0

        logger.info(
            "[NotificationEngine] generate_monthly_report done: %d created", created_count
        )
        return created_count


# ── Module-level singleton ────────────────────────────────────────────────────
notification_engine = NotificationEngine()
