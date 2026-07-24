"""
scheme_recommendations.py
==========================
GET /api/v1/schemes/recommendations

Returns personalised scheme eligibility recommendations driven entirely
by documents already stored in the user's Vault.

No OCR. No Gemini. No document re-upload.
Reads vault state → runs eligibility engine → returns structured result.
"""

from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.services import user_service
from app.services.scheme_engine import SchemeEngine

router = APIRouter(prefix="/schemes", tags=["scheme-recommendations"])


def _get_user_id(db: Session, current_uid: str):
    user = user_service.get_user_by_uid(db, current_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user.id


@router.get("/recommendations", response_model=List[Any])
def get_scheme_recommendations(
    category: Optional[str] = Query(
        default=None,
        description="Filter recommendations by scheme category (e.g. 'Agriculture', 'Health')",
    ),
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> List[Any]:
    """
    GET /api/v1/schemes/recommendations

    Returns a list of government scheme eligibility results, computed from
    documents already stored in the user's Vault.

    Each result includes:
      - scheme_id, scheme_name, category, priority
      - status: Eligible | Partially Eligible | Not Eligible
      - health_score: 0–100 readiness score
      - matched_documents: list of vault document titles that cover requirements
      - missing_documents: list of template_ids for required but absent docs
      - expired_documents: list of vault document titles that are expired
      - expiring_soon_documents: vault docs expiring within 30 days
      - required_count, matched_count, completion_pct
    """
    user_id = _get_user_id(db, current_uid)

    engine = SchemeEngine()
    try:
        recommendations = engine.get_recommendations(db, user_id, category=category)
    except Exception as exc:
        print(f"[SchemeRecommendations] Engine error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scheme engine failed: {exc}",
        )

    return [rec.model_dump() for rec in recommendations]


@router.get("/recommendations/summary", response_model=Any)
def get_recommendations_summary(
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> Any:
    """
    GET /api/v1/schemes/recommendations/summary

    Returns aggregate statistics for quick display on the home dashboard:
      - total_schemes: int
      - eligible: int
      - partially_eligible: int
      - not_eligible: int
      - top_eligible: list of top 3 eligible scheme names
      - top_missing: list of most commonly missing document template_ids
    """
    user_id = _get_user_id(db, current_uid)

    engine = SchemeEngine()
    try:
        recommendations = engine.get_recommendations(db, user_id)
    except Exception as exc:
        print(f"[SchemeRecommendations] Summary engine error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scheme engine failed: {exc}",
        )

    eligible = [r for r in recommendations if r.status == "Eligible"]
    partial = [r for r in recommendations if r.status == "Partially Eligible"]
    not_eligible = [r for r in recommendations if r.status == "Not Eligible"]

    # Most-missing document types across all schemes
    from collections import Counter
    missing_counter: Counter = Counter()
    for rec in not_eligible + partial:
        for doc_id in rec.missing_documents:
            missing_counter[doc_id] += 1

    return {
        "total_schemes": len(recommendations),
        "eligible": len(eligible),
        "partially_eligible": len(partial),
        "not_eligible": len(not_eligible),
        "top_eligible": [r.scheme_name for r in eligible[:3]],
        "top_missing": [doc_id for doc_id, _ in missing_counter.most_common(5)],
    }
