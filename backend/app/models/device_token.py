import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID

from app.database.connection import Base

def _now() -> datetime:
    return datetime.now(timezone.utc)

class DeviceToken(Base):
    """ORM model for the `device_tokens` table. Tracks FCM tokens for multiple devices per user."""

    __tablename__ = "device_tokens"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token = Column(String(255), nullable=False, unique=True, index=True)
    platform = Column(String(20), nullable=False) # e.g., 'android', 'ios'
    is_active = Column(Boolean, nullable=False, default=True)

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

    __table_args__ = (
        UniqueConstraint("user_id", "token", name="uq_user_device_token"),
    )
