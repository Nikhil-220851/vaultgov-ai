import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.database.connection import Base

def _now() -> datetime:
    return datetime.now(timezone.utc)

class UserAIPreferences(Base):
    __tablename__ = "user_ai_preferences"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    user_id = Column(String(128), unique=True, nullable=False, index=True)
    memory_enabled = Column(Boolean, nullable=False, default=True)
    detailed_responses = Column(Boolean, nullable=False, default=True)
    
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
