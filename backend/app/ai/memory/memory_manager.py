from typing import Dict, List, Union, Any
from app.ai.memory.conversation_memory import ConversationMemory
from app.ai.memory.memory_types import UserTurn, AssistantTurn
from datetime import datetime, timezone

class MemoryManager:
    """
    Singleton-like manager to manage in-memory conversation history per conversation.
    """
    _store: Dict[str, ConversationMemory] = {}
    
    @classmethod
    def _get_key(cls, uid: str, conversation_id: str) -> str:
        return f"{uid}_{conversation_id}"

    @classmethod
    def _get_memory(cls, uid: str, conversation_id: str) -> ConversationMemory:
        key = cls._get_key(uid, conversation_id)
        if key not in cls._store:
            cls._store[key] = ConversationMemory(maxlen=10)
        return cls._store[key]

    @classmethod
    def add_user_message(cls, uid: str, conversation_id: str, message: str, intent: str, backend_context: Dict[str, Any]):
        memory = cls._get_memory(uid, conversation_id)
        turn: UserTurn = {
            "role": "user",
            "message": message,
            "intent": intent,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "backend_context": backend_context
        }
        memory.add_turn(turn)

    @classmethod
    def add_assistant_message(cls, uid: str, conversation_id: str, message: str, intent: str, backend_context: Dict[str, Any]):
        memory = cls._get_memory(uid, conversation_id)
        turn: AssistantTurn = {
            "role": "assistant",
            "message": message,
            "intent": intent,
            "backend_context": backend_context
        }
        memory.add_turn(turn)
        
    @classmethod
    def get_recent_history(cls, uid: str, conversation_id: str, memory_enabled: bool = True) -> List[Union[UserTurn, AssistantTurn]]:
        if not memory_enabled:
            return []
        key = cls._get_key(uid, conversation_id)
        if key not in cls._store:
            return []
        return cls._store[key].get_history()
        
    @classmethod
    def clear(cls, uid: str, conversation_id: str):
        key = cls._get_key(uid, conversation_id)
        if key in cls._store:
            cls._store[key].clear()
            
    @classmethod
    def trim(cls, uid: str, conversation_id: str):
        key = cls._get_key(uid, conversation_id)
        if key in cls._store:
            cls._store[key].trim()
