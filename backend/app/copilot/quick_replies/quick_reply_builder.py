from typing import Dict, Any, List
from app.copilot.types import Intent, QuickReply
from .quick_reply_types import InternalQuickReply
from .quick_reply_registry import get_registry, make_upload_document

MAX_QUICK_REPLIES = 4

class QuickReplyBuilder:
    @staticmethod
    def build(intent: Intent, metadata: Dict[str, Any]) -> List[QuickReply]:
        """
        Generate contextual quick reply chips based on intent and metadata.
        """
        if metadata is None:
            metadata = {}
            
        registry = get_registry()
        
        # 1. Fetch baseline quick replies for the intent
        builder_func = registry.get(intent)
        if not builder_func:
            return []
            
        baseline_replies = builder_func()

        # 2. Modify dynamically based on metadata context
        if intent == Intent.DOCUMENT_STATUS:
            docs_meta = metadata.get("documents", {})
            has_documents = docs_meta.get("has_documents", False)
            
            # Disable "My Documents" if they have 0 documents
            if not has_documents:
                for reply in baseline_replies:
                    if reply.id == "my_documents":
                        reply.enabled = False
            else:
                # Disable upload document if they already have them? 
                # Let's keep it but just as an example for context
                pass
                
        elif intent == Intent.GREETING:
            docs_meta = metadata.get("documents", {})
            if not docs_meta.get("has_documents", False):
                # Replace My Documents with Upload Document contextually
                for reply in baseline_replies:
                    if reply.id == "my_documents":
                        reply.enabled = False
                baseline_replies.append(make_upload_document())

        # 3. Filter by enabled
        enabled_replies = [r for r in baseline_replies if r.enabled]

        # 4. Deduplicate based on id while preserving order of first appearance
        seen_ids = set()
        deduped_replies: List[InternalQuickReply] = []
        for reply in enabled_replies:
            if reply.id not in seen_ids:
                deduped_replies.append(reply)
                seen_ids.add(reply.id)

        # 5. Sort replies by priority (lower number = higher priority)
        deduped_replies.sort(key=lambda r: r.priority)

        # 6. Cap at MAX_QUICK_REPLIES and convert to external model
        final_replies = deduped_replies[:MAX_QUICK_REPLIES]
        return [reply.to_quick_reply() for reply in final_replies]
