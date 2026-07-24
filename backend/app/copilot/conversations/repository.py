from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.conversation import Conversation, Message

class ConversationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_conversation(self, title: str, user_id: str) -> Conversation:
        conversation = Conversation(title=title, user_id=user_id)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        return self.db.query(Conversation).filter(Conversation.id == conversation_id).first()

    def get_user_conversations(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Conversation]:
        return (
            self.db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def rename_conversation(self, conversation_id: str, new_title: str) -> Optional[Conversation]:
        conversation = self.get_conversation(conversation_id)
        if conversation:
            conversation.title = new_title
            self.db.commit()
            self.db.refresh(conversation)
        return conversation

    def delete_conversation(self, conversation_id: str) -> bool:
        conversation = self.get_conversation(conversation_id)
        if conversation:
            self.db.delete(conversation)
            self.db.commit()
            return True
        return False

    def add_message(self, conversation_id: str, role: str, content: str, assistant_data: Optional[dict] = None) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            assistant_data=assistant_data
        )
        self.db.add(message)
        self.db.flush()
        
        # Update conversation timestamp
        conversation = self.get_conversation(conversation_id)
        if conversation:
            conversation.updated_at = message.created_at

        self.db.commit()
        self.db.refresh(message)
        return message

    def get_conversation_history(self, conversation_id: str) -> List[Message]:
        return (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .all()
        )
