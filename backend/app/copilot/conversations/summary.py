from typing import List
from app.models.conversation import Message

class ConversationSummaryService:
    """
    A lightweight service for abstracting conversation summaries.
    Currently, it returns the full history unchanged. In the future, this boundary
    can be used to compress or summarize older parts of long conversations
    before passing them to the AI pipeline.
    """
    
    def __init__(self):
        pass
        
    def summarize(self, history: List[Message]) -> List[Message]:
        # Future-proofing: Here we might group older messages into a single summary 
        # message to reduce token counts.
        return history
