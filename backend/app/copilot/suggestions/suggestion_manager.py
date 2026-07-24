from typing import List, Dict, Any, Optional
from app.copilot.types import Intent, CopilotAction
from .suggestion_types import InternalAction
from .suggestion_registry import get_registry
from .recommendation_engine import RecommendationEngine

MAX_SUGGESTIONS = 3

class SuggestionBuilder:
    @staticmethod
    def get_default() -> List[InternalAction]:
        """Return the default fallback actions."""
        EXPLORE_SCHEMES = InternalAction(type="open_schemes", label="Explore Schemes", priority=1)
        VIEW_DOCUMENTS = InternalAction(type="open_documents", label="View Documents", priority=2)
        return [EXPLORE_SCHEMES, VIEW_DOCUMENTS]

    @staticmethod
    def get(intent: Intent, metadata: Optional[Dict[str, Any]] = None, memory: Any = None) -> List[CopilotAction]:
        """
        Generate contextual suggestions based on intent, metadata, and memory.
        """
        if metadata is None:
            metadata = {}

        registry = get_registry()

        # 1. Fetch baseline actions from registry
        baseline_actions = registry.get(intent, SuggestionBuilder.get_default()).copy()

        # Instantiate required internal actions for logic overrides
        UPLOAD_DOCUMENT = InternalAction(type="upload_document", label="Upload Document", priority=1)
        UPLOAD_MISSING_DOCUMENTS = InternalAction(type="upload_document", label="Upload Missing Documents", priority=1)
        EXPLORE_SCHEMES = InternalAction(type="open_schemes", label="Explore Schemes", priority=1)
        COMPLETE_PROFILE = InternalAction(type="complete_profile", label="Complete Profile", priority=1)

        # 2. Modify dynamically based on metadata context
        if intent == Intent.DOCUMENT_STATUS:
            docs_meta = metadata.get("documents", {})
            if not docs_meta.get("has_documents", False):
                baseline_actions = [UPLOAD_DOCUMENT]

        elif intent == Intent.ELIGIBILITY:
            elig_meta = metadata.get("eligibility", {})
            eligible_count = elig_meta.get("eligible_count", 0)
            partially_eligible_count = elig_meta.get("partially_eligible_count", 0)
            missing_docs = elig_meta.get("missing_documents", [])
            
            if not eligible_count and partially_eligible_count and missing_docs:
                baseline_actions = [UPLOAD_MISSING_DOCUMENTS, EXPLORE_SCHEMES]
            elif not eligible_count and not partially_eligible_count:
                baseline_actions = [COMPLETE_PROFILE, EXPLORE_SCHEMES]

        elif intent == Intent.PROFILE_SUMMARY:
            profile_meta = metadata.get("profile", {})
            if not profile_meta.get("profile_completed", False):
                baseline_actions = [COMPLETE_PROFILE]
                
        # 3. Append actions from RecommendationEngine
        baseline_actions.extend(RecommendationEngine.get_recommendations(intent, metadata, memory))

        # 4. Deduplicate based on action type while preserving order of first appearance
        seen_types = set()
        deduped_actions: List[InternalAction] = []
        for action in baseline_actions:
            if action.type not in seen_types:
                deduped_actions.append(action)
                seen_types.add(action.type)

        # 5. Sort actions by priority (lower number = higher priority)
        # Note: python's sort is stable, which preserves order for equal priorities.
        deduped_actions.sort(key=lambda a: a.priority)

        # 6. Cap at MAX_SUGGESTIONS and convert to external model
        final_actions = deduped_actions[:MAX_SUGGESTIONS]
        return [action.to_copilot_action() for action in final_actions]
