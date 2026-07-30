from typing import Any, Dict

class ContextBuilder:
    """
    Converts backend outputs into structured text for Gemini.
    """

    @staticmethod
    def build_context(data: Dict[str, Any], user_question: str) -> str:
        """
        Builds a text context representation of the structured data for Gemini.
        """
        sections = []

        # 1. Conversation Summary
        if "conversation_history" in data:
            sections.append(f"Conversation Summary:\n{data['conversation_history']}")
        
        # 2. Current User Goal
        if "intent" in data:
            sections.append(f"Current User Goal (Detected Intent):\n{str(data['intent']).capitalize()}")

        active_ctx = data.get("active_context", {})
        
        # 3. Active Entity
        active_doc = active_ctx.get("active_document")
        active_scheme = active_ctx.get("active_scheme")
        if active_doc:
            sections.append(f"Active Entity:\n- Document: {active_doc.get('title')} (Status: {active_doc.get('status')})")
        elif active_scheme:
            sections.append(f"Active Entity:\n- Scheme: {active_scheme.get('title')}")

        # 4. Relevant User Profile
        user = data.get("profile", None)
        if user:
            dist = getattr(user, "district", "Unknown")
            state = getattr(user, "state", "Unknown")
            if dist or state:
                sections.append(f"Relevant User Profile\n- District: {dist}\n- State: {state}")

        # 5. Relevant Documents
        docs_payload = data.get("documents", {})
        if docs_payload:
            requested_found = docs_payload.get("requested_doc_found")
            requested_type = docs_payload.get("requested_doc_type")
            
            doc_lines = ["Relevant Documents:"]
            if requested_found is False and requested_type:
                doc_lines.append(f"- The user's {requested_type} was NOT found in their VaultGov locker. Inform the user.")
            
            doc_list = docs_payload.get("documents", [])
            if doc_list:
                for d in doc_list:
                    # Depending on how it's passed (model vs dict)
                    if isinstance(d, dict):
                        doc_lines.append(f"- {d.get('title')} (Status: {d.get('status', 'Unknown')}, Expiry: {d.get('expiry_date', 'None')})")
                    else:
                        doc_lines.append(f"- {getattr(d, 'title', 'Unknown')} (Status: {getattr(d, 'status', 'Unknown')}, Expiry: {getattr(d, 'expiry_date', 'None')})")
                sections.append("\n".join(doc_lines))

        # 6. Expiring Documents
        exp_payload = data.get("expiring_documents", {})
        if exp_payload:
            exp_list = exp_payload.get("documents", [])
            if exp_list:
                exp_lines = ["Expiring Documents:"]
                for d in exp_list:
                    if isinstance(d, dict):
                        exp_lines.append(f"- {d.get('title')} (Status: {d.get('status', 'Unknown')}, Expiry: {d.get('expiry_date', 'None')})")
                    else:
                        exp_lines.append(f"- {getattr(d, 'title', 'Unknown')} (Status: {getattr(d, 'status', 'Unknown')}, Expiry: {getattr(d, 'expiry_date', 'None')})")
                sections.append("\n".join(exp_lines))

        # 7. Relevant Government Schemes
        schemes_payload = data.get("schemes", {})
        if schemes_payload:
            sch_list = schemes_payload.get("schemes", [])
            if sch_list:
                sch_lines = ["Relevant Government Information (Schemes):"]
                for s in sch_list[:5]: # Cap at 5 to save context
                    if isinstance(s, dict):
                        sch_lines.append(f"- {s.get('title')} (Portal: {s.get('officialApplyLink', 'Unknown')})")
                    else:
                        sch_lines.append(f"- {getattr(s, 'title', 'Unknown')} (Portal: {getattr(s, 'officialApplyLink', 'Unknown')})")
                sections.append("\n".join(sch_lines))

        # 8. User Question
        sections.append(f"User Question:\n{user_question}")
        
        # 9. Instruction
        sections.append("Instructions:\n- Answer only within the VaultGov domain.\n- Reason over the Conversation Summary to understand the context.\n- Provide a natural, ChatGPT-like response.")
        
        return "\n\n".join(sections).strip()
