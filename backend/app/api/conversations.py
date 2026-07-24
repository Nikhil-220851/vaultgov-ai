from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.schemas.conversation import Conversation, ConversationWithMessages, ConversationUpdate
from app.copilot.conversations.service import ConversationService

router = APIRouter(prefix="/copilot/conversations", tags=["conversations"])

@router.get("", response_model=List[Conversation])
def list_conversations(
    limit: int = 20,
    offset: int = 0,
    current_uid: str = Depends(get_current_uid),
    db: Session = Depends(get_db)
):
    service = ConversationService(db)
    return service.get_user_conversations(user_id=current_uid, limit=limit, offset=offset)

@router.get("/{conversation_id}", response_model=ConversationWithMessages)
def get_conversation_history(
    conversation_id: str,
    current_uid: str = Depends(get_current_uid),
    db: Session = Depends(get_db)
):
    service = ConversationService(db)
    conversation = service.get_conversation(conversation_id)
    if not conversation or conversation.user_id != current_uid:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation

@router.patch("/{conversation_id}", response_model=Conversation)
def rename_conversation(
    conversation_id: str,
    update_data: ConversationUpdate,
    current_uid: str = Depends(get_current_uid),
    db: Session = Depends(get_db)
):
    service = ConversationService(db)
    conversation = service.get_conversation(conversation_id)
    if not conversation or conversation.user_id != current_uid:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    updated = service.rename_conversation(conversation_id, update_data.title)
    return updated

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    current_uid: str = Depends(get_current_uid),
    db: Session = Depends(get_db)
):
    service = ConversationService(db)
    conversation = service.get_conversation(conversation_id)
    if not conversation or conversation.user_id != current_uid:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    service.delete_conversation(conversation_id)
    return None
