from collections import deque
from typing import List, Union
from app.ai.memory.memory_types import UserTurn, AssistantTurn

class ConversationMemory:
    """
    Maintains a rolling in-memory conversation history for a single session.
    """
    def __init__(self, maxlen: int = 10):
        self.history = deque(maxlen=maxlen)
        
    def add_turn(self, turn: Union[UserTurn, AssistantTurn]):
        self.history.append(turn)
        
    def get_history(self) -> List[Union[UserTurn, AssistantTurn]]:
        return list(self.history)
        
    def clear(self):
        self.history.clear()
        
    def trim(self, maxlen: int = 10):
        while len(self.history) > maxlen:
            self.history.popleft()
