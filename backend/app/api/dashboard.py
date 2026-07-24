from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.models.document import Document
from app.services import user_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def _get_user_id(db: Session, current_uid: str):
    user = user_service.get_user_by_uid(db, current_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user.id

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> Any:
    user_id = _get_user_id(db, current_uid)

    docs = db.query(Document).filter(Document.user_id == user_id).all()
    
    total_documents = len(docs)
    active_documents = sum(1 for d in docs if d.status == "ACTIVE")
    expired_documents = sum(1 for d in docs if d.status == "EXPIRED")
    expiring_soon = sum(1 for d in docs if d.status == "EXPIRING_SOON")
    documents_without_expiry = sum(1 for d in docs if d.status == "NO_EXPIRY" or d.status == "INVALID_DATE" or not d.status)
    
    total_health = sum((d.health_score or 0) for d in docs)
    average_health_score = (total_health / total_documents) if total_documents > 0 else 0
    
    # Category breakdown
    category_breakdown = {}
    for d in docs:
        cat = d.category or "Uncategorised"
        category_breakdown[cat] = category_breakdown.get(cat, 0) + 1

    # Expiry timeline (next 6 months)
    expiry_timeline = []

    # Recent uploads (top 5)
    recent_uploads = sorted(docs, key=lambda d: d.created_at, reverse=True)[:5]
    recent_uploads_data = []
    for d in recent_uploads:
        recent_uploads_data.append({
            "id": str(d.id),
            "title": d.title,
            "category": d.category,
            "status": d.status,
            "created_at": d.created_at.isoformat()
        })

    return {
        "total_documents": total_documents,
        "active_documents": active_documents,
        "expired_documents": expired_documents,
        "expiring_soon": expiring_soon,
        "documents_without_expiry": documents_without_expiry,
        "average_health_score": round(average_health_score, 1),
        "category_breakdown": category_breakdown,
        "expiry_timeline": expiry_timeline,
        "recent_uploads": recent_uploads_data
    }
