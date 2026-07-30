"""
users.py — REST endpoints for user account management.

All routes require a valid Firebase ID token in the Authorization header.
The verified UID from the JWT must match the :firebase_uid path parameter
(prevents users from reading or modifying each other's data).
"""

from dataclasses import asdict
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.models.scheme import Scheme
from app.schemas.user import (
    UserCreate,
    UserPermissionsUpdate,
    UserProfileUpdate,
    UserResponse,
    UserAIPreferencesUpdate,
    UserAIPreferencesResponse,
)
from app.services import user_service, document_service
from app.copilot.eligibility_engine import (
    EligibilityEngine,
    invalidate_eligibility_cache,
)

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

    invalidate_eligibility_cache(firebase_uid)
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


# ─── GET /users/:firebase_uid/ai-settings — Get AI Settings ──────────────

@router.get("/{firebase_uid}/ai-settings", response_model=UserAIPreferencesResponse)
def get_ai_settings(
    firebase_uid: str,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> UserAIPreferencesResponse:
    _assert_owns_record(current_uid, firebase_uid)

    from app.models.user_preferences import UserAIPreferences
    
    prefs = db.query(UserAIPreferences).filter_by(user_id=firebase_uid).first()
    if not prefs:
        prefs = UserAIPreferences(user_id=firebase_uid)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
        
    return UserAIPreferencesResponse.model_validate(prefs)


# ─── PUT /users/:firebase_uid/ai-settings — Update AI Settings ──────────────

@router.put("/{firebase_uid}/ai-settings", response_model=UserAIPreferencesResponse)
def update_ai_settings(
    firebase_uid: str,
    body: UserAIPreferencesUpdate,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> UserAIPreferencesResponse:
    _assert_owns_record(current_uid, firebase_uid)

    from app.models.user_preferences import UserAIPreferences
    
    prefs = db.query(UserAIPreferences).filter_by(user_id=firebase_uid).first()
    if not prefs:
        prefs = UserAIPreferences(user_id=firebase_uid)
        db.add(prefs)
        
    prefs.memory_enabled = body.memory_enabled
    prefs.detailed_responses = body.detailed_responses
    db.commit()
    db.refresh(prefs)
        
    return UserAIPreferencesResponse.model_validate(prefs)


# ─── DELETE /users/:firebase_uid/ai-settings — Reset AI Settings ────────────

@router.delete("/{firebase_uid}/ai-settings", response_model=UserAIPreferencesResponse)
def reset_ai_settings(
    firebase_uid: str,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> UserAIPreferencesResponse:
    _assert_owns_record(current_uid, firebase_uid)

    from app.models.user_preferences import UserAIPreferences
    
    prefs = db.query(UserAIPreferences).filter_by(user_id=firebase_uid).first()
    if not prefs:
        prefs = UserAIPreferences(user_id=firebase_uid)
        db.add(prefs)
        
    prefs.memory_enabled = True
    prefs.detailed_responses = True
    db.commit()
    db.refresh(prefs)
        
    return UserAIPreferencesResponse.model_validate(prefs)



@router.get("/{firebase_uid}/eligibility", response_model=Dict[str, Any])
def get_eligibility(
    firebase_uid: str,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> Dict[str, Any]:
    """
    Run the deterministic Eligibility Engine against every active scheme for
    the authenticated user.

    Returns a structured payload grouped by eligibility status:
        eligible_schemes, partially_eligible, not_eligible,
        insufficient_information, missing_documents,
        missing_profile_fields, recommendations, profile_completion.

    Results are cached for 5 minutes per user.
    Cache is automatically invalidated when the user updates their profile
    or adds/removes a document.
    """
    _assert_owns_record(current_uid, firebase_uid)

    result = EligibilityEngine.evaluate_all(db, firebase_uid)

    # evaluate_all returns {} sentinel (not a list) when user not found
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with firebase_uid '{firebase_uid}' not found.",
        )

    return result


# ─── GET /users/:firebase_uid/eligibility/:scheme_id — Single scheme ─────────


@router.get("/{firebase_uid}/eligibility/{scheme_id}", response_model=Dict[str, Any])
def get_scheme_eligibility(
    firebase_uid: str,
    scheme_id: str,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> Dict[str, Any]:
    """
    Evaluate eligibility for a single scheme for the authenticated user.

    Returns a single EvaluationResult with:
        scheme_id, scheme_name, status, confidence,
        matched_rules, failed_rules,
        missing_information, missing_documents,
        recommendation, next_steps.
    """
    _assert_owns_record(current_uid, firebase_uid)

    # Resolve user
    user = user_service.get_user_by_uid(db, firebase_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with firebase_uid '{firebase_uid}' not found.",
        )

    # Resolve scheme
    scheme = db.query(Scheme).filter(Scheme.schemeId == scheme_id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{scheme_id}' not found.",
        )

    # Resolve user documents
    user_docs = document_service.get_documents(db, user.id)

    # Run single-scheme evaluation (no caching — targeted call)
    result = EligibilityEngine.evaluate_scheme(scheme, user, user_docs)

    return {
        "scheme_id": result.scheme_id,
        "scheme_name": result.scheme_name,
        "status": result.status,
        "confidence": result.confidence,
        "matched_rules": [asdict(r) for r in result.matched_rules],
        "failed_rules": [asdict(r) for r in result.failed_rules],
        "missing_information": result.missing_information,
        "missing_documents": result.missing_documents,
        "recommendation": result.recommendation,
        "next_steps": result.next_steps,
    }
