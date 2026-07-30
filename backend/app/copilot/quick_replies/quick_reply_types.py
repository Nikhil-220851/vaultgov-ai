from pydantic import BaseModel, Field
from app.copilot.types import QuickReply

HIGH = 1
MEDIUM = 2
LOW = 3

class InternalQuickReply(BaseModel):
    """
    Internal representation of a quick reply before serialization to the client.
    Includes business-logic flags like priority and enabled.
    """
    id: str
    label: str
    message: str
    priority: int
    enabled: bool = True

    def to_quick_reply(self) -> QuickReply:
        return QuickReply(
            id=self.id,
            label=self.label,
            message=self.message
        )
