"""
types.py — Pydantic models for the VaultGov Copilot API.

These models define the public contract for POST /api/copilot/chat.
They are intentionally minimal at this stage — fields will be expanded
incrementally as intent detection, context building, and memory are added.

Models
------
Intent         — enum of all supported copilot intents
ChatRequest    — incoming request body
CopilotAction  — a single suggested action returned by the copilot
CopilotSource  — a source reference (scheme, document, etc.) cited by the copilot
ChatResponse   — outgoing response body
"""

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Intent enum ───────────────────────────────────────────────────────────────


class Intent(str, Enum):
    """
    All intents the VaultGov Copilot can classify.

    Inheriting from `str` means the enum serialises to its string value in
    JSON automatically — no custom serialiser needed.

    Values
    ------
    UNKNOWN             Default / low-confidence fallback.
    SCHEME_EXPLAIN      User wants an explanation of a specific scheme.
    SCHEME_COMPARE      User wants to compare two or more schemes.
    ELIGIBILITY         User asking whether they qualify for a scheme.
    ELIGIBILITY_REASON  User asking WHY they are not eligible.
    REQUIRED_DOCUMENTS  User asking what documents a scheme requires.
    DOCUMENT_REMINDER   User asking about expiring / expiry of documents.
    DOCUMENT_UPLOAD     User wants to upload a document.
    DOCUMENT_STATUS     User asking about the status of an existing document.
    RENEWAL_GUIDE       User asking how to renew a document or licence.
    APP_HELP            User asking how to use the VaultGov app itself.
    GREETING            Conversational opener (hi, hello, etc.).
    UNSUPPORTED         Request is clearly out of scope for VaultGov.
    """

    UNKNOWN            = "unknown"
    SCHEME_EXPLAIN     = "scheme_explain"
    SCHEME_COMPARE     = "scheme_compare"
    ELIGIBILITY        = "eligibility"
    ELIGIBILITY_REASON = "eligibility_reason"
    REQUIRED_DOCUMENTS = "required_documents"
    DOCUMENT_REMINDER  = "document_reminder"
    DOCUMENT_UPLOAD    = "document_upload"
    DOCUMENT_STATUS    = "document_status"
    RENEWAL_GUIDE      = "renewal_guide"
    APP_HELP           = "app_help"
    GREETING           = "greeting"
    UNSUPPORTED        = "unsupported"
    ACTIVE_SCHEMES     = "active_schemes"
    PROFILE_SUMMARY    = "profile_summary"
    APPLICATION_STATISTICS = "application_statistics"


# ── Request ───────────────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    """
    Payload sent by the mobile client for each turn of conversation.

    Attributes
    ----------
    message : str
        The natural-language message from the user.
        Must be a non-empty string (max 2 000 chars to avoid abuse).
    """

    message: str = Field(
        ...,
        min_length=1,
        max_length=2_000,
        description="User's natural-language message.",
        examples=["What government schemes am I eligible for?"],
    )


# ── Response sub-models ───────────────────────────────────────────────────────


class CopilotAction(BaseModel):
    """
    A discrete action the copilot suggests the user take.

    Attributes
    ----------
    type  : str   Action category (e.g. "view_scheme", "upload_document").
    label : str   Human-readable button / link label.
    data  : dict  Arbitrary payload the mobile client needs to perform the action.
    """

    type: str = Field(..., description="Action category identifier.")
    label: str = Field(..., description="Human-readable label for this action.")
    data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary payload required by the mobile client.",
    )


class CopilotSource(BaseModel):
    """
    A source the copilot used or is recommending.

    Attributes
    ----------
    type  : str   Source category (e.g. "scheme", "document", "faq").
    id    : str   Stable identifier (schemeId, documentId, …).
    title : str   Human-readable name.
    url   : str   Optional deep-link or external URL.
    """

    type: str = Field(..., description="Source category.")
    id: str = Field(..., description="Stable source identifier.")
    title: str = Field(..., description="Human-readable source title.")
    url: Optional[str] = Field(None, description="Deep-link or external URL.")


# ── Response ──────────────────────────────────────────────────────────────────


class ChatResponse(BaseModel):
    """
    Top-level response returned by POST /api/copilot/chat.

    Attributes
    ----------
    message    : str                 Natural-language reply from the copilot.
    intent     : Intent              Detected intent (typed enum, serialises to string).
    confidence : float               Intent confidence score in [0.0, 1.0].
    actions    : List[CopilotAction] Suggested actions for the mobile client.
    sources    : List[CopilotSource] Sources cited by this response.
    metadata   : Dict[str, Any]      Free-form bag for future fields (latency, model,
                                     tokens used, conversation ID, debug info, etc.).
                                     Empty today; adding keys is non-breaking.
    """

    message: str = Field(..., description="Copilot reply text.")
    intent: Intent = Field(
        ...,
        description="Detected intent (typed enum, serialises to its string value).",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Intent confidence score between 0 and 1.",
    )
    actions: List[CopilotAction] = Field(
        default_factory=list,
        description="Suggested follow-up actions.",
    )
    sources: List[CopilotSource] = Field(
        default_factory=list,
        description="Sources referenced by this response.",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Free-form metadata bag. Intentionally empty in Phase 1. "
            "Planned fields: latency_ms, model, tokens_used, conversation_id, "
            "follow_up_suggestions, debug."
        ),
    )
