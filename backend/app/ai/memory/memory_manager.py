from typing import Dict, List, Union, Any
from app.ai.memory.conversation_memory import ConversationMemory
from app.ai.memory.memory_types import UserTurn, AssistantTurn
from datetime import datetime, timezone

class MemoryManager:
    """
    Singleton-like manager to manage in-memory conversation history per user.
    """
    _store: Dict[str, ConversationMemory] = {}
    
    @classmethod
    def _get_memory(cls, uid: str) -> ConversationMemory:
        if uid not in cls._store:
            cls._store[uid] = ConversationMemory(maxlen=10)
        return cls._store[uid]

    @classmethod
    def add_user_message(cls, uid: str, message: str, intent: str, backend_context: Dict[str, Any]):
        memory = cls._get_memory(uid)
        turn: UserTurn = {
            "role": "user",
            "message": message,
            "intent": intent,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "backend_context": backend_context
        }
        memory.add_turn(turn)

    @classmethod
    def add_assistant_message(cls, uid: str, message: str, intent: str, backend_context: Dict[str, Any]):
        memory = cls._get_memory(uid)
        turn: AssistantTurn = {
            "role": "assistant",
            "message": message,
            "intent": intent,
            "backend_context": backend_context
        }
        memory.add_turn(turn)
        
    @classmethod
    def get_recent_history(cls, uid: str) -> List[Union[UserTurn, AssistantTurn]]:
        if uid not in cls._store:
            return []
        return cls._store[uid].get_history()
        
    @classmethod
    def clear(cls, uid: str):
        if uid in cls._store:
            cls._store[uid].clear()
            
    @classmethod
    def trim(cls, uid: str):
        if uid in cls._store:
            cls._store[uid].trim()
