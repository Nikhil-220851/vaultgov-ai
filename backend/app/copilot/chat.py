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
    import time
    t0 = time.time()
    print("START REQUEST")
    print(f"[{time.time() - t0:.3f}s] Authentication completed")
    raw_body = await request.body()
    print("================== COPILOT ENDPOINT TRACE ==================")
    print("Request Body (Raw):", raw_body.decode("utf-8"))
    print("Parsed Body:", payload.model_dump())
    
    # ================== INTENT PLANNER (Phase 1.2) ==================
    from app.copilot.planner.planner import IntentPlanner
    
    planner_start = time.time()
    logger.info("Planner started")
    
    _intent_planner = IntentPlanner()
    planner_result = _intent_planner.plan(payload.message)
    
    planner_duration = (time.time() - planner_start) * 1000
    logger.info("Planner finished")
    logger.info(f"Planner duration: {planner_duration:.2f} ms")
    
    entities_list = []
    for entity_type, entity_values in planner_result.entities.items():
        if isinstance(entity_values, list):
            for val in entity_values:
                entities_list.append(f"- {val.replace('_', ' ').title()}")
        else:
            entities_list.append(f"- {str(entity_values)}")
            
    entities_str = "\n".join(entities_list) if entities_list else "- None"
    needs_str = "\n".join(f"- {need.value.title()}" for need in planner_result.needs) if planner_result.needs else "- None"
    
    logger.info(
        f"\n--------------------------------\n"
        f"Intent: {planner_result.intent.value}\n"
        f"Confidence: {planner_result.confidence}\n"
        f"Decision: {planner_result.decision.value}\n"
        f"Reasoning: {planner_result.reasoning}\n\n"
        f"Entities:\n{entities_str}\n\n"
        f"Needs:\n{needs_str}\n"
        f"--------------------------------"
    )
    # ================================================================

    try:
        message_lower = payload.message.lower()

        # 1. Conversation lookup and Context Extraction
        from app.copilot.conversations.service import ConversationService
        from app.copilot.conversations.context import ConversationContextService
        import time
        from app.ai.context.entity_tracker import EntityTracker

        conversation_service = ConversationService(db)
        context_service = ConversationContextService()

        print(f"[{time.time() - t0:.3f}s] Conversation lookup started")

        if payload.conversation_id:
            conversation = conversation_service.get_conversation(payload.conversation_id)
            if not conversation or conversation.user_id != current_uid:
                conversation = conversation_service.create_conversation(current_uid, payload.message)
        else:
            conversation = conversation_service.create_conversation(current_uid, payload.message)

        conversation_id = conversation.id
        print(f"[{time.time() - t0:.3f}s] Conversation lookup finished")

        # Fetch DB history for intent detection (excluding the current un-saved message)
        db_history = conversation_service.get_conversation_history(conversation_id)
        history = context_service.build_history_for_memory(db_history)
        
        active_context = EntityTracker.extract_context(history)

        # 2. Custom inline checks for profile, stats, active schemes to route to the correct intents
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
            result = detect_intent(payload.message, active_context)
            intent = result.intent
            confidence = result.confidence
            matched_on = result.matched_on

        # 2. Execute Orchestration Framework Tools
        from app.copilot.tools.tool_router import ToolRouter
        
        tool_router = ToolRouter()
        tool_results = tool_router.execute_tools(db, current_uid, planner_result)
        
        resolver_data = {}
        loaded = []
        skipped = []
        
        if tool_results:
            # Phase 2.1: Tools executed successfully, merge their data
            logger.info("Tools executed successfully. Merging ToolResults.")
            for tr in tool_results:
                if tr.success and tr.data:
                    for key, value in tr.data.items():
                        if key in resolver_data:
                            if isinstance(resolver_data[key], list) and isinstance(value, list):
                                resolver_data[key].extend(value)
                            elif isinstance(resolver_data[key], dict) and isinstance(value, dict):
                                resolver_data[key].update(value)
                            else:
                                resolver_data[key] = value
                        else:
                            resolver_data[key] = value
                    loaded.append(f"Tool:{tr.tool_name}")
            
            # Additional structured logging for Phase 2.1
            logger.info(
                f"\n--- TOOL ORCHESTRATION FALLBACK AVOIDED ---\n"
                f"Planner Intent: {planner_result.intent.value}\n"
                f"Confidence: {planner_result.confidence}\n"
                f"Executed Tools: {[tr.tool_name for tr in tool_results]}"
            )
        else:
            # Phase 2.1 Logging: No tools matched
            logger.info(
                f"\n--- TOOL ORCHESTRATION FALLBACK ---\n"
                f"Planner Intent: {planner_result.intent.value}\n"
                f"Confidence: {planner_result.confidence}\n"
                f"Fallback Reason: No tools registered or can_handle() returned False for this intent.\n"
                f"Proceeding with legacy DataResolver."
            )
            
        # 2.5 Retrieve structured resolver data strictly based on PlannerResult
        from app.copilot.planner.planner_types import ContextSource
        
        retrieval_start = time.time()
    
        if ContextSource.PROFILE in planner_result.needs:
            resolver_data["profile"] = DataResolver.resolve_profile(db, current_uid)
            loaded.append("Profile")
        else:
            skipped.append("Profile")
            
        # ContextSource.DOCUMENTS is now handled exclusively by DocumentTool via ToolRouter
        if ContextSource.DOCUMENTS in planner_result.needs and not any(tr.success for tr in tool_results if tr.tool_name == "DocumentTool"):
            logger.warning("Documents requested but DocumentTool did not execute successfully. DataResolver no longer handles documents.")
            skipped.append("Documents")
            
        if ContextSource.SCHEMES in planner_result.needs:
            resolver_data["schemes"] = DataResolver.resolve_schemes(db)
            if intent in (Intent.ELIGIBILITY, Intent.ELIGIBILITY_REASON):
                resolver_data["eligibility"] = DataResolver.resolve_eligibility(db, current_uid)
            loaded.append("Schemes")
        else:
            skipped.append("Schemes")
            
        if ContextSource.OCR in planner_result.needs:
            loaded.append("OCR")
        else:
            skipped.append("OCR")
            
        if ContextSource.HISTORY in planner_result.needs:
            loaded.append("History")
        else:
            skipped.append("History")

        retrieval_duration = (time.time() - retrieval_start) * 1000
        
        # Log structured context loading details
        needs_log = []
        for source in ["Documents", "Profile", "Schemes", "History", "OCR"]:
            mark = "✓" if (source in loaded or any(tr.tool_name == "DocumentTool" and source == "Documents" for tr in tool_results)) else "✗"
            needs_log.append(f"{source} {mark}")
            
        logger.info(
            f"\nPlanner requested:\n"
            + "\n".join(needs_log) +
            f"\n\nContext Builder loaded:\n"
            + ("\n".join(loaded) if loaded else "None") +
            f"\n\nSkipped:\n"
            + ("\n".join(skipped) if skipped else "None")
        )

        # 3. Format response using Response Builder (keep actions, sources, metadata)
        response = build_response(intent, confidence, resolver_data, matched_on)

        # 4. Generate natural language response via Gemini
        from app.ai.prompts.prompt_manager import PromptManager
        from app.ai.context_builder import ContextBuilder
        from app.ai.response_formatter import ResponseFormatter
        from app.ai.providers.provider_factory import ProviderFactory
        from app.ai.context_optimizer import ContextOptimizer
        from app.ai.prompt_validator import PromptValidator
        from app.ai.response_quality import ResponseQualityCheck
        
        provider = ProviderFactory.get_provider()
        
        # Save user message to DB
        conversation_service.add_message(conversation_id, "user", payload.message)
        
        # Prepare context data including intent and metadata
        history_summary = EntityTracker.summarize_history(history)
        context_dict = {
            "conversation_history": history_summary,
            "active_context": active_context,
            "intent": intent.value,
            "metadata": response.metadata,
            **resolver_data
        }
        
        # Optimize context
        context_dict = ContextOptimizer.optimize(context_dict)
        
        # Build structured context string
        context_text = ContextBuilder.build_context(context_dict, payload.message)
        
        system_prompt = PromptManager.get_prompt(intent)
        
        # Start tracking time and metrics for structured log
        start_time = time.time()
        fallback_used = False
        raw_ai_message = None
        
        # Validate prompt and context length
        if PromptValidator.validate(system_prompt, context_text):
            print(f"[{time.time() - t0:.3f}s] Gemini request started")
            # Generate raw response from provider
            raw_ai_message = provider.generate_response(
                message=payload.message,
                system_prompt=system_prompt,
                context=context_text
            )
            print(f"[{time.time() - t0:.3f}s] Gemini request finished")
            
            # Check response quality
            if raw_ai_message and not ResponseQualityCheck.check_quality(raw_ai_message):
                raw_ai_message = None
        
        elapsed_time = time.time() - start_time
        
        if raw_ai_message:
            # Format and validate final message
            final_message = ResponseFormatter.format(raw_ai_message)
            response.message = final_message
        else:
            fallback_used = True
            response.message = "I'm having trouble processing your request right now. Please try again later."
            
        # Log structured information
        logger.info(f"Intent: {intent.value}")
        logger.info(f"History Turns: {len(history)}")
        logger.info(f"Prompt: {intent.name.lower()}_prompt")
        logger.info(f"Context Tokens: {len(context_text) // 4}") # approximation
        logger.info(f"Response Time: {elapsed_time:.2f}s")
        logger.info(f"Fallback Used: {fallback_used}")
        
        # Save assistant message to DB
        backend_context = {
            "active_context": active_context,
            "intent": intent.value,
            "metadata": response.metadata,
        }
        assistant_data = {
            "intent": intent.value,
            "backend_context": backend_context,
            "actions": [action.model_dump() for action in response.actions],
            "cards": [card.model_dump() for card in response.cards],
            "quick_replies": [qr.model_dump() for qr in response.quick_replies],
            "metadata": response.metadata,
            "sources": [source.model_dump() for source in response.sources]
        }
        print(f"[{time.time() - t0:.3f}s] Database save started")
        conversation_service.add_message(conversation_id, "assistant", response.message, assistant_data=assistant_data)
        print(f"[{time.time() - t0:.3f}s] Database save finished")
        
        # Add conversation_id to response metadata so client can track it
        response.metadata["conversation_id"] = conversation_id

        print("Response Body:", response.model_dump())
        print("================== TYPE INSPECTION ==================")
        def print_types(obj, path=""):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    print_types(v, path + f"['{k}']")
            elif isinstance(obj, list):
                for i, v in enumerate(obj):
                    print_types(v, path + f"[{i}]")
            else:
                if "CopilotSource" in str(type(obj)):
                    print(f"FOUND CopilotSource at: {path}")
                print(f"{path}: {type(obj)}")
        
        print("Response object type:", type(response))
        print_types(response.model_dump(), "response_dump")
        for field_name in response.model_fields.keys():
            val = getattr(response, field_name)
            print_types(val, f"response.{field_name}")
            
        print("============================================================")
        print(f"[{time.time() - t0:.3f}s] Returning response")
        return response
    except Exception as e:
        import traceback
        logger.exception("Copilot failed")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
