from typing import TypedDict, Any, Dict, Optional

class UserTurn(TypedDict):
    role: str # "user"
    message: str
    intent: str
    timestamp: str
    backend_context: Dict[str, Any]

class AssistantTurn(TypedDict):
    role: str # "assistant"
    message: str
    intent: str
    backend_context: Dict[str, Any]
