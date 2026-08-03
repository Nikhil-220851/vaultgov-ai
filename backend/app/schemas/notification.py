"""
notification.py — Pydantic v2 schemas for the Notification resource.

Follows the same pattern as schemas/user.py and schemas/document.py.

Schemas:
    NotificationResponse        — single notification returned from all GET endpoints
    NotificationListResponse    — paginated list wrapper
    UnreadCountResponse         — badge count
    RegisterDeviceRequest       — POST /notifications/register-device body
    SendNotificationRequest     — POST /notifications/send body
    RegisterPushTokenRequest    — POST /notifications/register-push-token body (deprecated)
    MarkReadResponse            — PATCH /notifications/{id}/read response
    BulkActionResponse          — PATCH /notifications/read-all, DELETE /notifications/clear
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class NotificationResponse(BaseModel):
    """Serialised representation of a single Notification row."""

    id: UUID
    user_id: UUID
    document_id: Optional[UUID] = None

    type: str
    category: str
    priority: str

    title: str
    message: str
    payload: Optional[dict[str, Any]] = None

    is_read: bool
    delivery_status: str
    push_sent: bool

    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    """Paginated list of notifications."""

    items: list[NotificationResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class UnreadCountResponse(BaseModel):
    """Badge count for the notification bell icon."""

    count: int


class RegisterPushTokenRequest(BaseModel):
    """
    Body for POST /notifications/register-push-token.

    The token must be a valid Expo push token string.
    Example: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
    """

    token: str = Field(..., min_length=1, max_length=200)

    @field_validator("token")
    @classmethod
    def token_must_be_expo_format(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Push token cannot be blank.")
        # Accept both ExponentPushToken[...] and bare tokens for flexibility
        return v


class RegisterDeviceRequest(BaseModel):
    """
    Body for POST /notifications/register-device.
    """
    device_token: str = Field(..., min_length=1, max_length=500)
    platform: str = Field(..., description="e.g., 'android', 'ios', 'web'")

    @field_validator("device_token")
    @classmethod
    def token_must_not_be_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Device token cannot be blank.")
        return v


class SendNotificationRequest(BaseModel):
    """
    Body for POST /notifications/send.
    """
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    data: Optional[dict[str, Any]] = None


class MarkReadResponse(BaseModel):
    """Response for single notification mark-read."""

    success: bool
    notification: Optional[NotificationResponse] = None


class BulkActionResponse(BaseModel):
    """Response for bulk operations (mark-all-read, clear-all)."""

    success: bool
    affected: int
