import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    String,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID

from app.database.connection import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """ORM model for the `users` table."""

    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    firebase_uid = Column(String(128), unique=True, nullable=False, index=True)
    mobile_number = Column(String(20), nullable=True, index=True)
    email = Column(String(255), nullable=True)
    full_name = Column(String(120), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    state = Column(String(80), nullable=True)
    district = Column(String(80), nullable=True)
    occupation = Column(String(80), nullable=True)
    annual_income = Column(String(50), nullable=True)
    profile_completed = Column(Boolean, nullable=False, default=False)
    expo_push_token = Column(String(200), nullable=True)
    """Expo push notification token. Updated on each app launch after login."""
    # Tracks whether the user has passed through the Grant Permissions screen.
    # Used only for onboarding progress — never used to grant real device access.
    onboarding_permissions_seen = Column(Boolean, nullable=False, default=False)
    aadhaar_verified = Column(Boolean, nullable=False, default=False)
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
