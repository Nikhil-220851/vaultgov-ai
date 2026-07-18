"""
response_builder.py — VaultGov Copilot Response Builder.

Converts structured resolver payloads into formatted user-facing chat replies,
suggested actions, and deep-link sources.
"""

from typing import Dict, Any, List
from app.copilot.types import ChatResponse, Intent, CopilotAction, CopilotSource

def _serialize_doc(doc: Any) -> Dict[str, Any]:
    """Helper to convert a Document model instance into a JSON-safe dictionary."""
    return {
        "id": str(doc.id),
        "title": doc.title,
        "subtitle": doc.subtitle,
        "expiry_text": doc.expiry_text,
        "category": doc.category,
        "visual_state": doc.visual_state,
        "icon_name": doc.icon_name,
        "image_uri": doc.image_uri,
    }

def _serialize_scheme(s: Any) -> Dict[str, Any]:
    """Helper to convert a Scheme model instance into a JSON-safe dictionary."""
    return {
        "schemeId": s.schemeId,
        "title": s.title,
        "subtitle": s.subtitle,
        "category": s.category,
        "status": s.status,
        "applicationEnd": s.applicationEnd,
        "officialApplyLink": s.officialApplyLink,
        "ministry": s.ministry,
    }

def build_response(
    intent: Intent,
    confidence: float,
    resolver_data: Dict[str, Any],
    matched_on: str
) -> ChatResponse:
    """
    Format a standard ChatResponse based on the detected intent and data.
    """
    message = "temporary placeholder"
    actions: List[CopilotAction] = []
    sources: List[CopilotSource] = []
    metadata = {
        "matched_on": matched_on,
        "phase": "2.5",
    }

    # 1. GREETING
    if intent == Intent.GREETING:
        message = (
            "Hello! I am your VaultGov Copilot. I can help you search active schemes, "
            "check document statuses, find documents that require renewal, "
            "or summarize your profile and upload statistics. How can I assist you today?"
        )
        actions = [
            CopilotAction(type="open_schemes", label="Explore Schemes", data={}),
            CopilotAction(type="open_documents", label="View Documents", data={}),
        ]

    # 2. DOCUMENT_STATUS
    elif intent == Intent.DOCUMENT_STATUS:
        doc_res = resolver_data.get("documents", {})
        serialized_docs = [_serialize_doc(d) for d in doc_res.get("documents", [])]
        metadata["documents"] = {
            "has_documents": doc_res.get("has_documents", False),
            "count": doc_res.get("count", 0),
            "documents": serialized_docs
        }
        
        if not doc_res.get("has_documents", False):
            message = "You haven't uploaded any documents yet."
            actions = [
                CopilotAction(type="upload_document", label="Upload Document", data={})
            ]
        else:
            docs = doc_res.get("documents", [])
            doc_lines = []
            for doc in docs:
                status_label = "Uploaded"
                if doc.visual_state == "success":
                    status_label = "Verified"
                elif doc.visual_state == "warning":
                    status_label = "Needs Attention"
                elif doc.visual_state == "danger":
                    status_label = "Action Required"
                category_part = f" (Category: {doc.category})" if doc.category else ""
                doc_lines.append(f"- {doc.title}{category_part} [Status: {status_label}]")
            
            message = "Here are your uploaded documents:\n" + "\n".join(doc_lines)
            actions = [
                CopilotAction(type="open_documents", label="Manage Documents", data={})
            ]
            sources = [
                CopilotSource(type="document", id=str(doc.id), title=doc.title)
                for doc in docs
            ]

    # 3. DOCUMENT_REMINDER
    elif intent == Intent.DOCUMENT_REMINDER:
        rem_res = resolver_data.get("expiring_documents", {})
        serialized_reminders = [_serialize_doc(d) for d in rem_res.get("documents", [])]
        metadata["expiring_documents"] = {
            "has_expiring": rem_res.get("has_expiring", False),
            "count": rem_res.get("count", 0),
            "documents": serialized_reminders
        }
        
        if not rem_res.get("has_expiring", False):
            message = "No documents require renewal."
        else:
            docs = rem_res.get("documents", [])
            doc_lines = []
            for doc in docs:
                expiry_info = f" ({doc.expiry_text})" if doc.expiry_text else ""
                doc_lines.append(f"- {doc.title}{expiry_info}")
            
            message = "The following documents require renewal or action:\n" + "\n".join(doc_lines)
            actions = [
                CopilotAction(type="upload_document", label="Update Document", data={}),
                CopilotAction(type="open_documents", label="View Documents", data={}),
            ]
            sources = [
                CopilotSource(type="document", id=str(doc.id), title=doc.title)
                for doc in docs
            ]

    # 4. ACTIVE_SCHEMES or ELIGIBILITY
    elif intent == Intent.ACTIVE_SCHEMES or intent == Intent.ELIGIBILITY:
        scheme_res = resolver_data.get("schemes", {})
        serialized_schemes = [_serialize_scheme(s) for s in scheme_res.get("schemes", [])]
        metadata["schemes"] = {
            "has_schemes": scheme_res.get("has_schemes", False),
            "count": scheme_res.get("count", 0),
            "schemes": serialized_schemes
        }
        
        if not scheme_res.get("has_schemes", False):
            message = "There are no active schemes available at the moment."
        else:
            schemes = scheme_res.get("schemes", [])
            top_schemes = schemes[:5]
            scheme_lines = []
            for s in top_schemes:
                deadline = f" (End Date: {s.applicationEnd})" if s.applicationEnd else ""
                scheme_lines.append(f"- {s.title}{deadline}")
            
            message = "Here are the active schemes available:\n" + "\n".join(scheme_lines)
            if len(schemes) > 5:
                message += f"\n...and {len(schemes) - 5} more schemes."
            actions = [
                CopilotAction(type="open_schemes", label="Go to Scheme Centre", data={})
            ]
            sources = [
                CopilotSource(type="scheme", id=s.schemeId, title=s.title, url=s.officialApplyLink)
                for s in top_schemes
            ]

    # 5. PROFILE_SUMMARY
    elif intent == Intent.PROFILE_SUMMARY:
        profile_res = resolver_data.get("profile", {})
        metadata["profile"] = {
            "profile_completed": profile_res.get("profile_completed", False),
            "missing_fields": profile_res.get("missing_fields", [])
        }
        
        user = profile_res.get("user")
        if not user:
            message = "Your user profile could not be found."
        elif profile_res.get("profile_completed", False):
            message = (
                "Your profile is complete! You have provided your name, date of birth, gender, state, district, occupation, and annual income. "
                "This information is used to match you with eligible government schemes."
            )
            actions = [
                CopilotAction(type="open_schemes", label="Explore Schemes", data={})
            ]
        else:
            missing_fields = profile_res.get("missing_fields", [])
            missing_text = ", ".join(missing_fields)
            message = (
                f"Your profile is currently incomplete. To match you with eligible schemes, "
                f"please complete your profile. Missing fields: {missing_text}."
            )
            actions = [
                CopilotAction(type="complete_profile", label="Complete Profile", data={})
            ]

    # 6. APPLICATION_STATISTICS
    elif intent == Intent.APPLICATION_STATISTICS:
        stats = resolver_data.get("statistics", {})
        serialized_recent = [_serialize_doc(d) for d in stats.get("recent_uploads", [])]
        metadata["statistics"] = {
            "total_documents": stats.get("total_documents", 0),
            "total_categories": stats.get("total_categories", 0),
            "storage_used_bytes": stats.get("storage_used_bytes", 0),
            "recent_uploads": serialized_recent
        }
        
        storage_mb = stats.get("storage_used_bytes", 0) / (1024 * 1024)
        message = (
            f"Here is your application and document summary:\n"
            f"- Total Documents Uploaded: {stats.get('total_documents', 0)}\n"
            f"- Categories Covered: {stats.get('total_categories', 0)}\n"
            f"- Estimated Storage: {storage_mb:.1f} MB"
        )
        actions = [
            CopilotAction(type="open_documents", label="View Uploads", data={}),
            CopilotAction(type="open_schemes", label="View Schemes", data={}),
        ]
        recent = stats.get("recent_uploads", [])
        sources = [
            CopilotSource(type="document", id=str(doc.id), title=doc.title)
            for doc in recent
        ]

    # 7. APP_HELP
    elif intent == Intent.APP_HELP:
        message = (
            "Welcome to VaultGov! I am your digital copilot. You can ask me to:\n"
            "- Check the status of your documents (\"Check document status\")\n"
            "- Find expiring documents (\"Which documents expire?\")\n"
            "- View active schemes (\"Show active schemes\")\n"
            "- View profile status (\"Is my profile complete?\")\n"
            "- Summarize upload statistics (\"Show my stats\")\n\n"
            "How can I assist you today?"
        )
        actions = [
            CopilotAction(type="open_schemes", label="Go to Scheme Centre", data={}),
            CopilotAction(type="open_documents", label="Manage Documents", data={}),
        ]

    # 8. Unsupported / Fallback
    else:
        message = (
            "I'm sorry, I didn't quite understand that. "
            "You can ask me about your documents, active government schemes, "
            "eligibility, your profile status, or upload statistics."
        )
        actions = [
            CopilotAction(type="open_schemes", label="Explore Schemes", data={}),
            CopilotAction(type="open_documents", label="View Documents", data={}),
        ]
        sources = []

    return ChatResponse(
        message=message,
        intent=intent,
        confidence=confidence,
        actions=actions,
        sources=sources,
        metadata=metadata
    )
