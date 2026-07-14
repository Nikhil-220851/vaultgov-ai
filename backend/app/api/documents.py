from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate
from app.services import document_service, user_service

router = APIRouter(prefix="/documents", tags=["documents"])


def _get_user_id(db: Session, current_uid: str) -> UUID:
    user = user_service.get_user_by_uid(db, current_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user.id


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    body: DocumentCreate,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> DocumentResponse:
    user_id = _get_user_id(db, current_uid)
    doc = document_service.create_document(db, user_id, body)
    return DocumentResponse.model_validate(doc)


@router.get("/", response_model=List[DocumentResponse])
def get_documents(
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> List[DocumentResponse]:
    user_id = _get_user_id(db, current_uid)
    docs = document_service.get_documents(db, user_id)
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> DocumentResponse:
    user_id = _get_user_id(db, current_uid)
    doc = document_service.get_document(db, document_id, user_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return DocumentResponse.model_validate(doc)


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: UUID,
    body: DocumentUpdate,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> DocumentResponse:
    user_id = _get_user_id(db, current_uid)
    doc = document_service.update_document(db, document_id, user_id, body)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return DocumentResponse.model_validate(doc)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> None:
    user_id = _get_user_id(db, current_uid)
    success = document_service.delete_document(db, document_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
