from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.conversation import Conversation, Message
from app.copilot.conversations.repository import ConversationRepository

class ConversationService:
    def __init__(self, db: Session):
        self.repository = ConversationRepository(db)

    def _generate_title(self, first_message: str) -> str:
        # Simple truncation for now. In the future, this could use an LLM.
        title = first_message.strip()
        if len(title) > 40:
            title = title[:37] + "..."
        return title

    def create_conversation(self, user_id: str, first_message_content: str = "") -> Conversation:
        title = "New Conversation"
        if first_message_content:
            title = self._generate_title(first_message_content)
        return self.repository.create_conversation(title=title, user_id=user_id)

    def get_user_conversations(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Conversation]:
        return self.repository.get_user_conversations(user_id=user_id, limit=limit, offset=offset)

    def rename_conversation(self, conversation_id: str, new_title: str) -> Optional[Conversation]:
        return self.repository.rename_conversation(conversation_id, new_title)

    def delete_conversation(self, conversation_id: str) -> bool:
        return self.repository.delete_conversation(conversation_id)

    def add_message(self, conversation_id: str, role: str, content: str, assistant_data: Optional[dict] = None) -> Message:
        return self.repository.add_message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            assistant_data=assistant_data
        )

    def get_conversation_history(self, conversation_id: str) -> List[Message]:
        return self.repository.get_conversation_history(conversation_id)

    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        return self.repository.get_conversation(conversation_id)
