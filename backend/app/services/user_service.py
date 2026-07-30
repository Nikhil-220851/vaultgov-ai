"""
user_service.py — Business logic for user CRUD operations.

All DB interactions use parameterised SQLAlchemy ORM queries.
No raw SQL strings are used in this file.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserPermissionsUpdate, UserProfileUpdate


def get_or_create_user(
    db: Session,
    firebase_uid: str,
    mobile_number: Optional[str] = None,
    email: Optional[str] = None,
) -> tuple[User, bool]:
    """
    Looks up a user by firebase_uid. If not found, creates a new record.
    Returns (user, created) where created=True means a new record was inserted.
    This function is idempotent — safe to call on every login.
    """
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()

    if user:
        updated = False
        if mobile_number and not user.mobile_number:
            user.mobile_number = mobile_number
            updated = True
        if email and not user.email:
            user.email = email
            updated = True
            
        if updated:
            user.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(user)
        return user, False
        

    user = User(
        firebase_uid=firebase_uid,
        mobile_number=mobile_number,
        email=email,
        profile_completed=False,
        onboarding_permissions_seen=False,
        aadhaar_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, True


def get_user_by_uid(db: Session, firebase_uid: str) -> Optional[User]:
    """Fetch a single user by their Firebase UID. Returns None if not found."""
    return db.query(User).filter(User.firebase_uid == firebase_uid).first()


def update_user_profile(
    db: Session,
    firebase_uid: str,
    data: UserProfileUpdate,
) -> Optional[User]:
    """
    Saves the complete-profile form data for an existing user.
    Sets profile_completed = True.
    Returns the updated User, or None if the user does not exist.
    """
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        return None

    user.full_name = data.full_name
    user.date_of_birth = data.date_of_birth
    user.gender = data.gender
    user.state = data.state
    user.district = data.district
    user.occupation = data.occupation
    user.annual_income = data.annual_income
    
    # Save mobile number and email. 
    # If the user explicitly clears the field (empty string on frontend),
    # the schema validator converts it to None, which will be saved as NULL.
    user.mobile_number = data.mobile_number
    user.email = data.email

    # Save profile image URL (Cloudinary URL or None to remove)
    if data.profile_image_url is not None:
        user.profile_image_url = data.profile_image_url

    user.profile_completed = True
    user.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)
    return user


def mark_permissions_seen(
    db: Session,
    firebase_uid: str,
    data: UserPermissionsUpdate,
) -> Optional[User]:
    """
    Marks the onboarding permissions screen as seen.
    Returns the updated User, or None if not found.
    """
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        return None

    user.onboarding_permissions_seen = data.onboarding_permissions_seen
    user.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)
    return user
