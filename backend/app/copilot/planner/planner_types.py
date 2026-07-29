from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class Intent(str, Enum):
    GREETING = "GREETING"
    DOCUMENT_STATUS = "DOCUMENT_STATUS"
    DOCUMENT_RENEWAL = "DOCUMENT_RENEWAL"
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    SCHEME_DISCOVERY = "SCHEME_DISCOVERY"
    ELIGIBILITY_CHECK = "ELIGIBILITY_CHECK"
    DOCUMENT_EXPIRY = "DOCUMENT_EXPIRY"
    PROFILE = "PROFILE"
    GENERAL_CHAT = "GENERAL_CHAT"
    HELP = "HELP"
    UNKNOWN = "UNKNOWN"

class ContextSource(str, Enum):
    DOCUMENTS = "documents"
    SCHEMES = "schemes"
    PROFILE = "profile"
    HISTORY = "history"
    OCR = "ocr"

class PlannerDecision(str, Enum):
    CONTINUE = "CONTINUE"
    ASK_FOR_CLARIFICATION = "ASK_FOR_CLARIFICATION"
    FALLBACK_TO_CHAT = "FALLBACK_TO_CHAT"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    REJECT = "REJECT"

class PlannerResult(BaseModel):
    intent: Intent
    confidence: float
    decision: PlannerDecision
    entities: Dict[str, Any] = Field(default_factory=dict)
    needs: List[ContextSource] = Field(default_factory=list)
    reasoning: str
