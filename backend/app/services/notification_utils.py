"""
notification_utils.py — Shared constants, helpers, and utilities for the
VaultGov notification system.

Keeps business logic (notification_engine) and data access (notification_service)
DRY by centralising the lookup tables and formatting functions here.
"""

from datetime import datetime, timezone, date
from typing import Optional
import hashlib


# ─── Priority Matrix ──────────────────────────────────────────────────────────

# Maps notification type prefix → (category, priority)
NOTIFICATION_DEFAULTS: dict[str, tuple[str, str]] = {
    # Document expiry
    "EXPIRY_90D":              ("DOCUMENT", "LOW"),
    "EXPIRY_60D":              ("DOCUMENT", "LOW"),
    "EXPIRY_30D":              ("DOCUMENT", "MEDIUM"),
    "EXPIRY_15D":              ("DOCUMENT", "HIGH"),
    "EXPIRY_7D":               ("DOCUMENT", "HIGH"),
    "EXPIRY_3D":               ("DOCUMENT", "CRITICAL"),
    "EXPIRY_1D":               ("DOCUMENT", "CRITICAL"),
    "EXPIRED":                 ("DOCUMENT", "CRITICAL"),
    "EXPIRY_OVERDUE":          ("DOCUMENT", "CRITICAL"),
    # Document health
    "DOC_HEALTH_BLURRY":       ("DOCUMENT", "HIGH"),
    "DOC_HEALTH_LOW_OCR":      ("DOCUMENT", "HIGH"),
    "DOC_HEALTH_DUPLICATE":    ("DOCUMENT", "MEDIUM"),
    "DOC_HEALTH_CROPPED":      ("DOCUMENT", "HIGH"),
    "DOC_HEALTH_MISSING_EXPIRY": ("DOCUMENT", "MEDIUM"),
    "DOC_HEALTH_FAILED":       ("DOCUMENT", "HIGH"),
    # Upload lifecycle
    "UPLOAD_STARTED":          ("UPLOAD", "LOW"),
    "UPLOAD_SUCCESS":          ("UPLOAD", "LOW"),
    "OCR_COMPLETE":            ("UPLOAD", "LOW"),
    "EXTRACTION_COMPLETE":     ("UPLOAD", "LOW"),
    "PROCESSING_FAILED":       ("UPLOAD", "HIGH"),
    # Government schemes
    "SCHEME_ELIGIBLE":         ("SCHEME", "HIGH"),
    "SCHEME_DEADLINE":         ("SCHEME", "HIGH"),
    "SCHEME_APPROVED":         ("SCHEME", "HIGH"),
    "SCHEME_REJECTED":         ("SCHEME", "MEDIUM"),
    "SCHEME_MISSING_DOC":      ("SCHEME", "MEDIUM"),
    "SCHEME_UPDATED":          ("SCHEME", "LOW"),
    # Security
    "SECURITY_NEW_LOGIN":      ("SECURITY", "HIGH"),
    "SECURITY_PASSWORD_CHANGED": ("SECURITY", "HIGH"),
    "SECURITY_DEVICE_CHANGED": ("SECURITY", "HIGH"),
    "BACKUP_COMPLETE":         ("SECURITY", "LOW"),
    "BACKUP_FAILED":           ("SECURITY", "HIGH"),
    # Smart AI
    "AI_RECOMMENDATION":       ("AI", "MEDIUM"),
    "AI_HEALTH_IMPROVED":      ("AI", "LOW"),
    "AI_DUPLICATE_FOUND":      ("AI", "MEDIUM"),
    "AI_UNUSED_DOC":           ("AI", "LOW"),
    "AI_PROFILE_SUGGESTION":   ("AI", "LOW"),
    # Summaries
    "WEEKLY_SUMMARY":          ("SUMMARY", "LOW"),
    "MONTHLY_REPORT":          ("SUMMARY", "LOW"),
}


def get_category_and_priority(notification_type: str) -> tuple[str, str]:
    """
    Returns (category, priority) for the given notification type.
    Falls back to ("GENERAL", "LOW") for unknown types.
    """
    return NOTIFICATION_DEFAULTS.get(notification_type, ("GENERAL", "LOW"))


# ─── Deduplication ───────────────────────────────────────────────────────────

def build_dedup_key(
    user_id: str,
    notification_type: str,
    document_id: Optional[str],
    ref_date: Optional[date] = None,
) -> str:
    """
    Builds a deterministic deduplication key for a notification.
    Two notifications with the same key should not both be created on the same day.

    Args:
        user_id:           UUID string of the target user
        notification_type: e.g. "EXPIRY_7D"
        document_id:       UUID string of associated document, or None
        ref_date:          Reference date (defaults to today UTC)

    Returns:
        A 32-char hex SHA-256 digest used as a lookup key.
    """
    day = (ref_date or datetime.now(timezone.utc).date()).isoformat()
    raw = f"{user_id}:{notification_type}:{document_id or 'none'}:{day}"
    return hashlib.sha256(raw.encode()).hexdigest()


# ─── Message Formatting ───────────────────────────────────────────────────────

def format_expiry_message(doc_title: str, days_left: int) -> tuple[str, str]:
    """
    Returns (title, message) for a document expiry notification.

    Args:
        doc_title: Human-readable document name e.g. "Aadhaar Card"
        days_left: Positive = days until expiry; 0 = expires today; negative = overdue

    Returns:
        Tuple of (notification title, notification message)
    """
    if days_left < 0:
        overdue = abs(days_left)
        return (
            f"{doc_title} Has Expired",
            f"Your {doc_title} expired {overdue} day{'s' if overdue != 1 else ''} ago. Renew it now to avoid disruption.",
        )
    if days_left == 0:
        return (
            f"{doc_title} Expires Today",
            f"Your {doc_title} expires today. Take action immediately to renew.",
        )
    return (
        f"{doc_title} Expires in {days_left} Day{'s' if days_left != 1 else ''}",
        f"Your {doc_title} will expire in {days_left} day{'s' if days_left != 1 else ''}. Renew it before the deadline.",
    )


def format_health_message(doc_title: str, issue: str) -> tuple[str, str]:
    """
    Returns (title, message) for document health notifications.

    Args:
        doc_title: Human-readable document name
        issue:     One of: blurry | low_ocr | duplicate | cropped | missing_expiry | failed

    Returns:
        Tuple of (notification title, notification message)
    """
    messages = {
        "blurry": (
            f"{doc_title} — Image Quality Issue",
            f"Your {doc_title} image appears blurry. Re-upload a clearer photo for better results.",
        ),
        "low_ocr": (
            f"{doc_title} — Low Recognition Confidence",
            f"AI had low confidence extracting data from your {doc_title}. Consider re-uploading.",
        ),
        "duplicate": (
            f"Duplicate {doc_title} Detected",
            f"A duplicate version of your {doc_title} was detected in your vault. Review and remove the older copy.",
        ),
        "cropped": (
            f"{doc_title} — Document Appears Cropped",
            f"Your {doc_title} image may be cropped or cut off. Re-scan the full document.",
        ),
        "missing_expiry": (
            f"{doc_title} — Expiry Date Not Found",
            f"We could not extract an expiry date from your {doc_title}. Please verify manually.",
        ),
        "failed": (
            f"{doc_title} — Verification Failed",
            f"Your {doc_title} could not be verified. Please re-upload or check the document quality.",
        ),
    }
    return messages.get(
        issue,
        (
            f"{doc_title} — Health Issue Detected",
            f"There may be an issue with your {doc_title}. Please review it in your vault.",
        ),
    )


def format_upload_message(doc_title: str, stage: str) -> tuple[str, str]:
    """
    Returns (title, message) for upload lifecycle notifications.

    Args:
        doc_title: Human-readable document name
        stage:     started | success | ocr_complete | extraction_complete | failed

    Returns:
        Tuple of (notification title, notification message)
    """
    messages = {
        "started": (
            "Upload Started",
            f"Uploading {doc_title}… This should only take a moment.",
        ),
        "success": (
            "Upload Successful",
            f"Your {doc_title} was uploaded successfully.",
        ),
        "ocr_complete": (
            "Text Extraction Complete",
            f"OCR processing for {doc_title} is done. Data is being structured.",
        ),
        "extraction_complete": (
            "Document Ready",
            f"Your {doc_title} has been fully processed and added to your vault.",
        ),
        "failed": (
            "Upload Failed",
            f"Processing your {doc_title} failed. Please try uploading again.",
        ),
    }
    return messages.get(
        stage,
        ("Upload Update", f"Your {doc_title} upload status has changed."),
    )


# ─── Expiry Milestone Map ─────────────────────────────────────────────────────

# Maps days-remaining to notification type
EXPIRY_MILESTONES: dict[int, str] = {
    90: "EXPIRY_90D",
    60: "EXPIRY_60D",
    30: "EXPIRY_30D",
    15: "EXPIRY_15D",
    7:  "EXPIRY_7D",
    3:  "EXPIRY_3D",
    1:  "EXPIRY_1D",
    0:  "EXPIRED",
}
