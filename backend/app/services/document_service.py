from typing import List, Optional
from uuid import UUID
import logging

from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.user import User
from datetime import datetime, timezone

def _now() -> datetime:
    return datetime.now(timezone.utc)
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.vault_service import vault_service
from app.services.notification_engine import notification_engine

logger = logging.getLogger(__name__)


def get_document(db: Session, document_id: UUID, user_id: UUID) -> Optional[Document]:
    return db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()


def get_documents(db: Session, user_id: UUID) -> List[Document]:
    return db.query(Document).filter(Document.user_id == user_id).order_by(Document.created_at.desc()).all()


def create_document(db: Session, user_id: UUID, obj_in: DocumentCreate) -> Document:
    # Phase 5: Calculate Smart Vault fields
    status, expiry_date = vault_service.calculate_smart_expiry(
        obj_in.extracted_text, 
        obj_in.supports_expiry
    )
    # We pass None for validation_result since it's not in the DB, but we could parse extracted_text
    # or just rely on OCR confidence and expiry for now
    health_score = vault_service.calculate_health_score(
        obj_in.extracted_text, 
        None, 
        status, 
        obj_in.confidence_score
    )
    renewal_priority = vault_service.generate_renewal_priority(status)

    db_obj = Document(
        user_id=user_id,
        title=obj_in.title,
        category=obj_in.category,
        tags=obj_in.tags,
        extracted_text=obj_in.extracted_text,
        image_uri=obj_in.image_uri,
        source=obj_in.source,
        confidence_score=obj_in.confidence_score,
        
        # Phase 5 Additions
        health_score=health_score,
        status=status,
        expiry_date=expiry_date,
        renewal_priority=renewal_priority,
        supports_expiry=obj_in.supports_expiry,
        validated_at=_now() if obj_in.extracted_text else None,
        status_changed_at=_now(),
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    try:
        notification_engine.generate_upload_notification(
            db=db,
            user_id=user_id,
            document_id=db_obj.id,
            stage="success",
            doc_title=db_obj.title
        )
    except Exception as e:
        logger.error(f"Failed to generate upload notification for document {db_obj.id}: {e}", exc_info=True)

    return db_obj


def update_document(db: Session, document_id: UUID, user_id: UUID, obj_in: DocumentUpdate) -> Optional[Document]:
    db_obj = get_document(db, document_id, user_id)
    if not db_obj:
        return None

    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    # Re-calculate Smart Vault fields on update if text changed
    if "extracted_text" in update_data:
        status, expiry_date = vault_service.calculate_smart_expiry(
            db_obj.extracted_text, 
            db_obj.supports_expiry
        )
        if db_obj.status != status:
            db_obj.status_changed_at = _now()
        
        db_obj.status = status
        db_obj.expiry_date = expiry_date
        db_obj.renewal_priority = vault_service.generate_renewal_priority(status)
        db_obj.health_score = vault_service.calculate_health_score(
            db_obj.extracted_text, 
            None, 
            status, 
            db_obj.confidence_score
        )

    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_document(db: Session, document_id: UUID, user_id: UUID) -> bool:
    db_obj = get_document(db, document_id, user_id)
    if not db_obj:
        return False
    
    doc_title = db_obj.title
    db.delete(db_obj)
    db.commit()

    try:
        notification_engine.generate_delete_notification(
            db=db,
            user_id=user_id,
            doc_title=doc_title
        )
    except Exception as e:
        logger.error(f"Failed to generate delete notification for document {document_id}: {e}", exc_info=True)

    return True
