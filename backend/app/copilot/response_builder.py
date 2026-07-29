"""
response_builder.py — VaultGov Copilot Response Builder.

Converts structured resolver payloads into formatted user-facing chat replies,
suggested actions, and deep-link sources.
"""

from typing import Dict, Any, List
from app.copilot.types import ChatResponse, Intent, CopilotAction, CopilotSource, CopilotCard, QuickReply
from app.copilot.suggestions import SuggestionBuilder
from app.copilot.cards import CardBuilder
from app.copilot.quick_replies import QuickReplyBuilder

def _serialize_doc(doc: Any) -> Dict[str, Any]:
    """Helper to convert a Document model instance into a JSON-safe dictionary."""
    return {
        "id": str(doc.id),
        "title": doc.title,
        "subtitle": doc.subtitle,
        "expiry_text": getattr(doc, 'expiry_text', None),
        "status": getattr(doc, 'status', None),
        "expiry_date": doc.expiry_date.isoformat() if getattr(doc, 'expiry_date', None) else None,
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
                status = getattr(doc, 'status', None)
                expiry_date = getattr(doc, 'expiry_date', None)
                
                if status == "EXPIRED" and expiry_date:
                    expiry_info = f" (Expired on {expiry_date.strftime('%b %d, %Y')})"
                elif status == "EXPIRING_SOON" and expiry_date:
                    expiry_info = f" (Expiring on {expiry_date.strftime('%b %d, %Y')})"
                else:
                    expiry_info = f" ({getattr(doc, 'expiry_text', '')})" if getattr(doc, 'expiry_text', None) else ""
                    
                doc_lines.append(f"- {doc.title}{expiry_info}")
            
            message = "The following documents require renewal or action:\n" + "\n".join(doc_lines)
            sources = [
                CopilotSource(type="document", id=str(doc.id), title=doc.title)
                for doc in docs
            ]

    # 4. ACTIVE_SCHEMES
    elif intent == Intent.ACTIVE_SCHEMES:
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
            sources = [
                CopilotSource(type="scheme", id=s.schemeId, title=s.title, url=s.officialApplyLink)
                for s in top_schemes
            ]

    # 5. ELIGIBILITY — personalized engine-backed result
    elif intent == Intent.ELIGIBILITY:
        elig_res = resolver_data.get("eligibility", {})

        eligible_schemes      = elig_res.get("eligible_schemes", [])
        partially_eligible    = elig_res.get("partially_eligible", [])
        not_eligible          = elig_res.get("not_eligible", [])
        insufficient_info     = elig_res.get("insufficient_information", [])
        missing_docs          = elig_res.get("missing_documents", [])
        missing_fields        = elig_res.get("missing_profile_fields", [])
        profile_completion    = elig_res.get("profile_completion", {})
        completion_pct        = profile_completion.get("percentage", 0)

        metadata["eligibility"] = {
            "eligible_count":          len(eligible_schemes),
            "partially_eligible_count": len(partially_eligible),
            "not_eligible_count":       len(not_eligible),
            "insufficient_info_count":  len(insufficient_info),
            "missing_documents":        missing_docs,
            "missing_profile_fields":   missing_fields,
            "profile_completion_pct":   completion_pct,
            "top_eligible_schemes":     eligible_schemes[:3],
        }

        if missing_fields and not eligible_schemes and not partially_eligible:
            # Profile too incomplete for meaningful evaluation
            missing_text = ", ".join(missing_fields)
            message = (
                f"Your profile is {completion_pct}% complete. "
                f"To accurately assess your eligibility, please provide: {missing_text}. "
                "Once complete, I can match you with the right schemes."
            )
        else:
            # Build natural-language summary
            lines = []

            if eligible_schemes:
                lines.append(f"✅ You are fully eligible for **{len(eligible_schemes)} scheme(s)**.")
                for s in eligible_schemes[:3]:
                    conf = s.get("confidence", 0)
                    lines.append(f"  • {s['scheme_name']} (Match: {conf}%)")

            if partially_eligible:
                lines.append(f"\n📋 **{len(partially_eligible)} scheme(s)** need missing documents:")
                for s in partially_eligible[:2]:
                    docs = ", ".join(s.get("missing_documents", [])[:2])
                    lines.append(f"  • {s['scheme_name']} — upload: {docs}")

            if insufficient_info:
                lines.append(
                    f"\n⚠️ **{len(insufficient_info)} scheme(s)** need more profile information "
                    f"({', '.join(missing_fields[:3])})."
                )

            if not eligible_schemes and not partially_eligible:
                lines.append(
                    "You are currently not eligible for any active scheme. "
                    "Complete your profile and upload required documents to improve your matches."
                )

            message = "\n".join(lines) if lines else "Eligibility evaluation is complete. Check the Scheme Centre for details."

            # Actions

            # Sources — top 3 eligible schemes
            sources = [
                CopilotSource(type="scheme", id=s["scheme_id"], title=s["scheme_name"])
                for s in eligible_schemes[:3]
            ]

    # 6. ELIGIBILITY_REASON — explain WHY user is not eligible for a scheme
    elif intent == Intent.ELIGIBILITY_REASON:
        elig_res = resolver_data.get("eligibility", {})

        not_eligible_schemes = elig_res.get("not_eligible", [])
        insufficient_info    = elig_res.get("insufficient_information", [])
        missing_fields       = elig_res.get("missing_profile_fields", [])

        metadata["eligibility"] = {
            "not_eligible_count":      len(not_eligible_schemes),
            "insufficient_info_count": len(insufficient_info),
            "missing_profile_fields":  missing_fields,
        }

        if not not_eligible_schemes and not insufficient_info:
            message = (
                "Based on your current profile, you appear eligible for at least some schemes. "
                "Visit the Scheme Centre to see your full eligibility breakdown."
            )
        else:
            lines = []
            if missing_fields:
                lines.append(
                    f"Your profile is incomplete. Missing: {', '.join(missing_fields)}. "
                    "This prevents accurate eligibility assessment for some schemes."
                )
            if not_eligible_schemes:
                lines.append(f"\nYou do not currently qualify for {len(not_eligible_schemes)} scheme(s). Common reasons:")
                for s in not_eligible_schemes[:3]:
                    failed = s.get("failed_rules", [])
                    if failed:
                        reason = failed[0].get("reason", "Criteria mismatch")
                        lines.append(f"  • {s['scheme_name']}: {reason}")
            message = "\n".join(lines)

        sources = []

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
        else:
            missing_fields = profile_res.get("missing_fields", [])
            missing_text = ", ".join(missing_fields)
            message = (
                f"Your profile is currently incomplete. To match you with eligible schemes, "
                f"please complete your profile. Missing fields: {missing_text}."
            )

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

    # 8. RENEWAL_GUIDE
    elif intent == Intent.RENEWAL_GUIDE:
        active_doc = resolver_data.get("active_document_context")
        metadata["renewal_guide"] = {}
        if active_doc:
            message = f"Here is the renewal information for your {active_doc.get('title', 'document')}."
            metadata["renewal_guide"]["active_document"] = active_doc
        else:
            message = "Here is the general renewal information for your document."

    # 9. SCHEME_EXPLAIN & SCHEME_COMPARE
    elif intent in (Intent.SCHEME_EXPLAIN, Intent.SCHEME_COMPARE):
        active_scheme = resolver_data.get("active_scheme_context")
        metadata["scheme_info"] = {}
        if active_scheme:
            message = f"Here is the detailed information for {active_scheme.get('title', 'the scheme')}."
            metadata["scheme_info"]["active_scheme"] = active_scheme
        else:
            message = "Here is the scheme information."

    # 10. REQUIRED_DOCUMENTS
    elif intent == Intent.REQUIRED_DOCUMENTS:
        active_doc = resolver_data.get("active_document_context")
        active_scheme = resolver_data.get("active_scheme_context")
        metadata["required_docs"] = {}
        if active_scheme:
            message = f"Here are the required documents for applying to {active_scheme.get('title', 'the scheme')}."
            metadata["required_docs"]["active_scheme"] = active_scheme
        elif active_doc:
            message = f"Here are the required documents for renewing your {active_doc.get('title', 'document')}."
            metadata["required_docs"]["active_document"] = active_doc
        else:
            message = "Here are the required documents."

    # 11. SERVICE_CENTRE
    elif intent == Intent.SERVICE_CENTRE:
        active_doc = resolver_data.get("active_document_context")
        active_scheme = resolver_data.get("active_scheme_context")
        profile = resolver_data.get("profile", {})
        user = profile.get("user")
        
        metadata["service_centre"] = {}
        if active_doc:
            metadata["service_centre"]["active_document"] = active_doc
        if active_scheme:
            metadata["service_centre"]["active_scheme"] = active_scheme
            
        if user and user.district:
            message = f"I am locating the nearest official service centre in {user.district}, {user.state}."
            metadata["service_centre"]["location"] = {"district": user.district, "state": user.state}
        else:
            message = "Please share your city or district so I can find the nearest service centre."

    # 8. Unsupported / Fallback
    else:
        message = (
            "I'm sorry, I didn't quite understand that. "
            "You can ask me about your documents, active government schemes, "
            "eligibility, your profile status, or upload statistics."
        )
        sources = []

    actions = SuggestionBuilder.get(intent, metadata)
    cards = CardBuilder.build(intent, metadata)
    quick_replies = QuickReplyBuilder.build(intent, metadata)

    return ChatResponse(
        message="",
        intent=intent,
        confidence=confidence,
        actions=actions,
        cards=cards,
        quick_replies=quick_replies,
        sources=sources,
        metadata=metadata
    )
