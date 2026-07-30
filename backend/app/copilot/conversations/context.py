from typing import List, Dict, Union, Any
from app.models.conversation import Message
from app.copilot.conversations.summary import ConversationSummaryService

class ConversationContextService:
    def __init__(self):
        self.summary_service = ConversationSummaryService()

    def build_history_for_memory(self, db_messages: List[Message]) -> List[Dict[str, Any]]:
        """
        Adapts DB messages into the format expected by the AI MemoryManager and ContextBuilder.
        """
        # 1. Run through SummaryService
        summarized = self.summary_service.summarize(db_messages)
        
        # 2. Adapt to UserTurn / AssistantTurn
        history = []
        for msg in summarized:
            turn = {
                "role": msg.role,
                "message": msg.content
            }
            if msg.assistant_data:
                turn["intent"] = msg.assistant_data.get("intent", "UNKNOWN")
                turn["backend_context"] = msg.assistant_data.get("backend_context", {})
            else:
                # Default empty if missing
                turn["intent"] = "UNKNOWN"
                turn["backend_context"] = {}
                
            if msg.role == "user":
                turn["timestamp"] = msg.created_at.isoformat()
            
            history.append(turn)
            
        return history
