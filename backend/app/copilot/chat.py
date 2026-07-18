"""
chat.py — VaultGov Copilot chat router.

Registers:
    POST /api/copilot/chat

This endpoint is authenticated via Firebase (same `get_current_uid`
dependency used by every other VaultGov router).

Phase History
-------------
Phase 1 — Foundation:  static placeholder response.
Phase 2 — Intent:      calls detect_intent(); returns classified intent + confidence.
Phase 2.5 — Real Data: integrates DataResolver to query real database/services
                        for supported intents, bypassing Gemini.
Phase 2.5 Refactored:   Separated retrieval (data_resolver.py) and user-facing
                        formatting (response_builder.py) for clean architecture.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import logging

from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.copilot.intent_detector import detect_intent
from app.copilot.data_resolver import DataResolver
from app.copilot.response_builder import build_response
from app.copilot.types import ChatRequest, ChatResponse, Intent

router = APIRouter(prefix="/copilot", tags=["copilot"])
logger = logging.getLogger("app.copilot.chat")


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="VaultGov Copilot chat",
    description=(
        "Send a message to the VaultGov Copilot. "
        "Phase 2.5: returns real data from database for supported intents."
    ),
)
async def copilot_chat(
    request: Request,
    payload: ChatRequest,
    current_uid: str = Depends(get_current_uid),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """
    POST /api/copilot/chat

    Phase 2.5 Refactored
    --------------------
    1. Determines the intent using inline checks and fallback regex detector.
    2. Resolves structured data payloads from the database via DataResolver.
    3. Builds the final user-facing response, actions, and sources via Response Builder.
    """
    # Print request body and parsed body as per Step 2
    raw_body = await request.body()
    print("================== COPILOT ENDPOINT TRACE ==================")
    print("Request Body (Raw):", raw_body.decode("utf-8"))
    print("Parsed Body:", payload.model_dump())

    message_lower = payload.message.lower()

    # 1. Custom inline checks for profile, stats, active schemes to route to the correct intents
    if "profile" in message_lower:
        intent = Intent.PROFILE_SUMMARY
        confidence = 1.0
        matched_on = "inline_profile"
    elif any(k in message_lower for k in ("stat", "statistics", "upload count", "summary of my uploads")):
        intent = Intent.APPLICATION_STATISTICS
        confidence = 1.0
        matched_on = "inline_statistics"
    elif any(k in message_lower for k in ("active scheme", "list scheme", "all schemes", "show schemes", "my schemes", "schemes")):
        intent = Intent.ACTIVE_SCHEMES
        confidence = 1.0
        matched_on = "inline_active_schemes"
    elif any(k in message_lower for k in ("my documents", "documents", "document status", "show documents", "view documents", "list documents")):
        intent = Intent.DOCUMENT_STATUS
        confidence = 1.0
        matched_on = "inline_document_status"
    else:
        # Fallback to intent detector
        result = detect_intent(payload.message)
        intent = result.intent
        confidence = result.confidence
        matched_on = result.matched_on

    # 2. Retrieve structured resolver data depending on intent
    try:
        resolver_data = {}
        if intent == Intent.DOCUMENT_STATUS:
            resolver_data["documents"] = DataResolver.resolve_documents(db, current_uid)
        elif intent == Intent.DOCUMENT_REMINDER:
            resolver_data["expiring_documents"] = DataResolver.resolve_expiring_documents(db, current_uid)
        elif intent in (Intent.ACTIVE_SCHEMES, Intent.ELIGIBILITY):
            resolver_data["schemes"] = DataResolver.resolve_schemes(db)
        elif intent == Intent.PROFILE_SUMMARY:
            resolver_data["profile"] = DataResolver.resolve_profile(db, current_uid)
        elif intent == Intent.APPLICATION_STATISTICS:
            resolver_data["statistics"] = DataResolver.resolve_statistics(db, current_uid)

        # 3. Format response using Response Builder
        response = build_response(intent, confidence, resolver_data, matched_on)
        print("Response Body:", response.model_dump())
        print("============================================================")
        return response
    except Exception as e:
        import traceback
        logger.exception("Copilot failed")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
