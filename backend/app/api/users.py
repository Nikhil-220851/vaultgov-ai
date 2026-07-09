"""
users.py — REST endpoints for user account management.

All routes require a valid Firebase ID token in the Authorization header.
The verified UID from the JWT must match the :firebase_uid path parameter
(prevents users from reading or modifying each other's data).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.schemas.user import (
    UserCreate,
    UserPermissionsUpdate,
    UserProfileUpdate,
    UserResponse,
)
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


def _assert_owns_record(current_uid: str, firebase_uid: str) -> None:
    """Raises 403 if the authenticated user is accessing another user's data."""
    if current_uid != firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorised to access this resource.",
        )


# ─── POST /users — First-login upsert ────────────────────────────────────────


@router.post("/", response_model=UserResponse, status_code=status.HTTP_200_OK)
def upsert_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> UserResponse:
    """
    Idempotent upsert called immediately after Firebase authentication.
    Creates the user if they don't exist; returns the existing record if they do.
    The firebase_uid in the body must match the authenticated JWT.
    """
    _assert_owns_record(current_uid, body.firebase_uid)

    user, created = user_service.get_or_create_user(
        db=db,
        firebase_uid=body.firebase_uid,
        mobile_number=body.mobile_number,
        email=body.email,
    )

    return UserResponse.model_validate(user)


# ─── GET /users/:firebase_uid — Fetch profile ────────────────────────────────


@router.get("/{firebase_uid}", response_model=UserResponse)
def get_user(
    firebase_uid: str,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> UserResponse:
    """Fetches the full user profile for the authenticated user."""
    _assert_owns_record(current_uid, firebase_uid)

    user = user_service.get_user_by_uid(db, firebase_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with firebase_uid '{firebase_uid}' not found.",
        )

    return UserResponse.model_validate(user)


# ─── GET /users/:firebase_uid/profile — Alias ────────────────────────────────


@router.get("/{firebase_uid}/profile", response_model=UserResponse)
def get_user_profile(
    firebase_uid: str,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> UserResponse:
    """Alias for GET /users/:firebase_uid — explicit profile endpoint."""
    _assert_owns_record(current_uid, firebase_uid)

    user = user_service.get_user_by_uid(db, firebase_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with firebase_uid '{firebase_uid}' not found.",
        )

    return UserResponse.model_validate(user)


# ─── PUT /users/:firebase_uid — Save complete profile ────────────────────────


@router.put("/{firebase_uid}", response_model=UserResponse)
def update_user_profile(
    firebase_uid: str,
    body: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> UserResponse:
    """
    Saves the Complete Profile form data.
    Sets profile_completed = true on success.
    """
    _assert_owns_record(current_uid, firebase_uid)

    user = user_service.update_user_profile(db, firebase_uid, body)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with firebase_uid '{firebase_uid}' not found.",
        )

    return UserResponse.model_validate(user)


# ─── PATCH /users/:firebase_uid/permissions — Mark permissions seen ──────────


@router.patch("/{firebase_uid}/permissions", response_model=UserResponse)
def update_permissions(
    firebase_uid: str,
    body: UserPermissionsUpdate,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> UserResponse:
    """
    Marks the Grant Permissions onboarding screen as seen.
    This is used only for onboarding progress tracking, not for actual access control.
    """
    _assert_owns_record(current_uid, firebase_uid)

    user = user_service.mark_permissions_seen(db, firebase_uid, body)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with firebase_uid '{firebase_uid}' not found.",
        )

    return UserResponse.model_validate(user)
