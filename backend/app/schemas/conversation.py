from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    role: str
    content: str
    assistant_data: Optional[Dict[str, Any]] = None


class MessageCreate(MessageBase):
    conversation_id: str


class Message(MessageBase):
    id: str
    conversation_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    title: str = "New Conversation"


class ConversationCreate(ConversationBase):
    user_id: str


class ConversationUpdate(BaseModel):
    title: Optional[str] = None


class Conversation(ConversationBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationWithMessages(Conversation):
    messages: List[Message] = []
