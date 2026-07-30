import os
from typing import Dict, Any, List

class EntityTracker:
    @staticmethod
    def extract_context(history: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        Extracts the current topic, entity, and intent from the conversation history.
        """
        context = {
            "current_topic": "General",
            "current_entity": "None",
            "last_intent": "UNKNOWN",
            "active_document": None,
            "active_scheme": None
        }
        
        # Traverse history backwards to find the last assistant turn with backend_context
        for turn in reversed(history):
            if turn.get("role") == "assistant" and turn.get("backend_context"):
                # Use the intent
                intent = turn.get("intent", "UNKNOWN")
                
                # Derive topic/entity based on backend_context
                bc = turn.get("backend_context", {})
                
                # Documents (or Expiring Documents)
                docs = []
                if "documents" in bc and isinstance(bc["documents"], dict):
                    docs = bc["documents"].get("documents", [])
                elif "expiring_documents" in bc and isinstance(bc["expiring_documents"], dict):
                    docs = bc["expiring_documents"].get("documents", [])
                    
                if docs:
                    doc = docs[0]
                    title = doc.get("title", "Document")
                    context["current_entity"] = title
                    context["current_topic"] = "Document"
                    context["last_intent"] = intent
                    
                    # Store detailed document info for context switching and pronoun resolution
                    context["active_document"] = {
                        "document_id": doc.get("id"),
                        "title": title,
                        "category": doc.get("category"),
                        "status": doc.get("status"),
                        "expiry_date": doc.get("expiry_date")
                    }
                    break

                # Schemes
                if "schemes" in bc and isinstance(bc["schemes"], dict):
                    schemes = bc["schemes"].get("schemes", [])
                    if schemes:
                        s = schemes[0]
                        title = s.get("title", "Scheme")
                        context["current_entity"] = title
                        context["current_topic"] = "Scheme"
                        context["last_intent"] = intent
                        
                        context["active_scheme"] = {
                            "schemeId": s.get("schemeId"),
                            "title": title,
                            "ministry": s.get("ministry"),
                            "applicationEnd": s.get("applicationEnd"),
                            "officialApplyLink": s.get("officialApplyLink")
                        }
                        break
                        
        return context

    @staticmethod
    def summarize_history(history: List[Dict[str, Any]]) -> str:
        """
        Provides a concise summary of the conversation flow to prevent overwhelming the LLM
        with massive raw message text.
        """
        if not history:
            return "No previous conversation history."
            
        summary_lines = []
        # Group by pairs if possible, or just sequential turns
        for turn in history[-10:]:  # Limit to last 10 turns for memory efficiency
            role = turn.get("role")
            if role == "user":
                msg = turn.get("message", "")
                summary_lines.append(f"- User asked: '{msg}'")
            elif role == "assistant":
                intent = turn.get("intent", "UNKNOWN")
                bc = turn.get("backend_context", {})
                msg = turn.get("message", "")
                
                # Check if an entity became active
                active_str = ""
                if "active_document" in bc and bc["active_document"]:
                    title = bc["active_document"].get("title", "")
                    active_str = f" (Active Document: {title})"
                elif "active_scheme" in bc and bc["active_scheme"]:
                    title = bc["active_scheme"].get("title", "")
                    active_str = f" (Active Scheme: {title})"
                    
                summary_lines.append(f"- AI: '{msg}' (Intent: {intent}{active_str})")
                
        return "\n".join(summary_lines)
