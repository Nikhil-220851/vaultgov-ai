"""
notifications.py — REST API endpoints for the Notification resource.

All routes require a valid Firebase ID token in the Authorization header.
The authenticated user can only access their own notifications — never
another user's data (enforced via _get_user_id which looks up by firebase_uid).

Endpoints:
    GET    /notifications                          — paginated list
    GET    /notifications/unread-count             — badge count
    PATCH  /notifications/read-all                 — mark all read
    DELETE /notifications/clear                    — clear all notifications
    PATCH  /notifications/{id}/read                — mark single read
    DELETE /notifications/{id}                     — delete single
    POST   /notifications/register-push-token      — store Expo push token
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.schemas.notification import (
    BulkActionResponse,
    MarkReadResponse,
    NotificationListResponse,
    NotificationResponse,
    RegisterPushTokenRequest,
    UnreadCountResponse,
)
from app.services import user_service
from app.services.notification_service import notification_manager

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ─── Ownership helper ─────────────────────────────────────────────────────────

def _get_user_id(db: Session, current_uid: str) -> UUID:
    """Resolves firebase UID → internal UUID; raises 404 if user not found."""
    user = user_service.get_user_by_uid(db, current_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return user.id


# ─── GET /notifications ───────────────────────────────────────────────────────

@router.get("/", response_model=NotificationListResponse)
def list_notifications(
    page: int = Query(default=1, ge=1, description="1-based page number"),
    page_size: int = Query(default=20, ge=1, le=50, description="Items per page (max 50)"),
    category: str | None = Query(
        default=None,
        description="Filter by category: DOCUMENT | SCHEME | SECURITY | AI | UPLOAD | SUMMARY",
    ),
    unread_only: bool = Query(default=False, description="Return only unread notifications"),
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> NotificationListResponse:
    """
    Returns a paginated, chronologically-sorted list of the authenticated user's
    notifications. Expired notifications (expires_at < now) are excluded.
    """
    user_id = _get_user_id(db, current_uid)
    result = notification_manager.get_notifications(
        db,
        user_id=user_id,
        page=page,
        page_size=page_size,
        category=category,
        unread_only=unread_only,
    )
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        has_more=result["has_more"],
    )


# ─── GET /notifications/unread-count ─────────────────────────────────────────

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> UnreadCountResponse:
    """
    Returns the unread notification count for the authenticated user.
    Used to populate the badge on the navigation tab and bell icon.
    """
    user_id = _get_user_id(db, current_uid)
    count = notification_manager.get_unread_count(db, user_id)
    return UnreadCountResponse(count=count)


# ─── PATCH /notifications/read-all ───────────────────────────────────────────

@router.patch("/read-all", response_model=BulkActionResponse)
def mark_all_read(
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> BulkActionResponse:
    """Marks all of the authenticated user's unread notifications as read."""
    user_id = _get_user_id(db, current_uid)
    affected = notification_manager.mark_all_read(db, user_id)
    return BulkActionResponse(success=True, affected=affected)


# ─── DELETE /notifications/clear ─────────────────────────────────────────────

@router.delete("/clear", response_model=BulkActionResponse)
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> BulkActionResponse:
    """Hard-deletes ALL notifications for the authenticated user."""
    user_id = _get_user_id(db, current_uid)
    affected = notification_manager.clear_all(db, user_id)
    return BulkActionResponse(success=True, affected=affected)


# ─── PATCH /notifications/{id}/read ──────────────────────────────────────────

@router.patch("/{notification_id}/read", response_model=MarkReadResponse)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> MarkReadResponse:
    """
    Marks a single notification as read.
    Returns 404 if the notification does not exist or belongs to a different user.
    """
    user_id = _get_user_id(db, current_uid)
    notif = notification_manager.mark_read(db, user_id, notification_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    return MarkReadResponse(
        success=True,
        notification=NotificationResponse.model_validate(notif),
    )


# ─── DELETE /notifications/{id} ──────────────────────────────────────────────

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> None:
    """
    Hard-deletes a single notification.
    Returns 404 if not found or not owned by the authenticated user.
    """
    user_id = _get_user_id(db, current_uid)
    deleted = notification_manager.delete_notification(db, user_id, notification_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )


# ─── POST /notifications/register-push-token ─────────────────────────────────

@router.post("/register-push-token", status_code=status.HTTP_200_OK)
def register_push_token(
    body: RegisterPushTokenRequest,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> dict:
    """
    Stores the Expo push notification token for the authenticated user.

    Call this immediately after the user grants notification permissions in the app,
    and again on each app launch to handle token rotation.

    Returns:
        {"success": true}
    """
    user_id = _get_user_id(db, current_uid)
    ok = notification_manager.register_push_token(db, user_id, body.token)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return {"success": True}
