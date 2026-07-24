from typing import Dict, Any
from pydantic import BaseModel, Field
from app.copilot.types import CopilotAction

class InternalAction(BaseModel):
    """
    An internal action representation that includes a priority.
    Lower number = higher priority (appears first).
    """
    type: str
    label: str
    data: Dict[str, Any] = Field(default_factory=dict)
    priority: int = 10
    
    def to_copilot_action(self) -> CopilotAction:
        return CopilotAction(type=self.type, label=self.label, data=self.data)
