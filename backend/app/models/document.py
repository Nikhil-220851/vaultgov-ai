import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Float,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database.connection import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    """ORM model for the `documents` table."""

    __tablename__ = "documents"

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
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    tags = Column(JSONB, nullable=False, default=list)
    extracted_text = Column(String, nullable=True)
    image_uri = Column(String, nullable=True)
    source = Column(String(50), nullable=False, default="camera")
    confidence_score = Column(Float, nullable=True)
    
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

    user = relationship("User", backref="documents")
