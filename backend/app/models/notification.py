import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID

from app.database.connection import Base

def _now() -> datetime:
    return datetime.now(timezone.utc)

class Notification(Base):
    """ORM model for the `notifications` table."""
    __tablename__ = "notifications"

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
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=True,
    )
    type = Column(String(50), nullable=False) # e.g., EXPIRY, RENEWAL
    title = Column(String(255), nullable=False)
    message = Column(String, nullable=False)
    priority = Column(String(50), nullable=False, default="LOW")
    is_read = Column(Boolean, nullable=False, default=False)
    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=_now,
    )
