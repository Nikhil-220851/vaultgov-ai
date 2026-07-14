from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate


def get_document(db: Session, document_id: UUID, user_id: UUID) -> Optional[Document]:
    return db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()


def get_documents(db: Session, user_id: UUID) -> List[Document]:
    return db.query(Document).filter(Document.user_id == user_id).order_by(Document.created_at.desc()).all()


def create_document(db: Session, user_id: UUID, obj_in: DocumentCreate) -> Document:
    db_obj = Document(
        user_id=user_id,
        title=obj_in.title,
        category=obj_in.category,
        tags=obj_in.tags,
        extracted_text=obj_in.extracted_text,
        image_uri=obj_in.image_uri,
        source=obj_in.source,
        confidence_score=obj_in.confidence_score,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_document(db: Session, document_id: UUID, user_id: UUID, obj_in: DocumentUpdate) -> Optional[Document]:
    db_obj = get_document(db, document_id, user_id)
    if not db_obj:
        return None

    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_document(db: Session, document_id: UUID, user_id: UUID) -> bool:
    db_obj = get_document(db, document_id, user_id)
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True
