from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.models.document import Document
from app.schemas.stats import StatsResponse
from app.schemas.document import DocumentResponse
from app.services import user_service

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> StatsResponse:
    user = user_service.get_user_by_uid(db, current_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user_id = user.id

    # Total documents
    total_docs = db.query(Document).filter(Document.user_id == user_id).count()

    # Total categories
    total_categories = (
        db.query(func.count(func.distinct(Document.category)))
        .filter(Document.user_id == user_id, Document.category != None)
        .scalar() or 0
    )

    # Storage used (mock calculation: 1MB per document for now, or sum of length of extracted_text)
    storage_used_bytes = total_docs * 1024 * 1024  # 1MB per document placeholder

    # Recent uploads (top 5)
    recent = (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
        .limit(5)
        .all()
    )
    
    recent_responses = [DocumentResponse.model_validate(d) for d in recent]

    return StatsResponse(
        total_documents=total_docs,
        total_categories=total_categories,
        storage_used_bytes=storage_used_bytes,
        recent_uploads=recent_responses,
    )
