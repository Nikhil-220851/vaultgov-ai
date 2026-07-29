"""
data_resolver.py — VaultGov Copilot Data Resolver.

Orchestrates calls to existing services and models to retrieve real
structured data for the copilot without implementing any custom business logic.
All methods return formatted dictionary payloads to allow reuse across
Copilot layers, widgets, and notifications.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.services import user_service, document_service
from app.models.document import Document
from app.models.user import User

class DataResolver:
    @staticmethod
    def get_user_by_uid(db: Session, firebase_uid: str) -> Optional[User]:
        """Fetch user by Firebase UID using user_service."""
        return user_service.get_user_by_uid(db, firebase_uid)



    @classmethod
    def resolve_profile(cls, db: Session, firebase_uid: str) -> Dict[str, Any]:
        """Retrieve user profile completeness information, formatted structurally."""
        user = cls.get_user_by_uid(db, firebase_uid)
        if not user:
            return {
                "user": None,
                "profile_completed": False,
                "missing_fields": []
            }
        
        missing_fields = []
        if not user.full_name: missing_fields.append("Full Name")
        if not user.date_of_birth: missing_fields.append("Date of Birth")
        if not user.gender: missing_fields.append("Gender")
        if not user.state: missing_fields.append("State")
        if not user.district: missing_fields.append("District")
        if not user.occupation: missing_fields.append("Occupation")
        if not user.annual_income: missing_fields.append("Annual Income")
        
        return {
            "user": user,
            "profile_completed": user.profile_completed,
            "missing_fields": missing_fields
        }

    @classmethod
    def resolve_statistics(cls, db: Session, firebase_uid: str) -> Dict[str, Any]:
        """Retrieve uploads/application stats for the user, formatted structurally."""
        user = cls.get_user_by_uid(db, firebase_uid)
        if not user:
            return {
                "total_documents": 0,
                "total_categories": 0,
                "storage_used_bytes": 0,
                "recent_uploads": []
            }
        
        from sqlalchemy import func
        total_docs = db.query(Document).filter(Document.user_id == user.id).count()
        total_categories = (
            db.query(func.count(func.distinct(Document.category)))
            .filter(Document.user_id == user.id, Document.category != None)
            .scalar() or 0
        )
        storage_used_bytes = total_docs * 1024 * 1024  # 1MB per document placeholder
        recent = (
            db.query(Document)
            .filter(Document.user_id == user.id)
            .order_by(Document.created_at.desc())
            .limit(5)
            .all()
        )
        return {
            "total_documents": total_docs,
            "total_categories": total_categories,
            "storage_used_bytes": storage_used_bytes,
            "recent_uploads": recent
        }


