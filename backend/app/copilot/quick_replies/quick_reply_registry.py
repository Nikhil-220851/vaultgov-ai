from typing import Dict, List, Callable
from app.copilot.types import Intent
from .quick_reply_types import InternalQuickReply, HIGH, MEDIUM, LOW

# Factory functions for reusable replies
def make_my_documents() -> InternalQuickReply:
    return InternalQuickReply(id="my_documents", label="My Documents", message="Show my documents", priority=HIGH)

def make_active_schemes() -> InternalQuickReply:
    return InternalQuickReply(id="active_schemes", label="Active Schemes", message="Show active schemes", priority=HIGH)

def make_check_eligibility() -> InternalQuickReply:
    return InternalQuickReply(id="check_eligibility", label="Check Eligibility", message="Check my eligibility", priority=HIGH)

def make_expiring_documents() -> InternalQuickReply:
    return InternalQuickReply(id="expiring_documents", label="Expiring Documents", message="Show expiring documents", priority=HIGH)

def make_upload_document() -> InternalQuickReply:
    return InternalQuickReply(id="upload_document", label="Upload Document", message="I want to upload a document", priority=HIGH)

def make_verified_documents() -> InternalQuickReply:
    return InternalQuickReply(id="verified_documents", label="Verified Documents", message="Show verified documents", priority=MEDIUM)

def make_government_scholarships() -> InternalQuickReply:
    return InternalQuickReply(id="government_scholarships", label="Government Scholarships", message="Show government scholarships", priority=MEDIUM)

def make_agriculture_schemes() -> InternalQuickReply:
    return InternalQuickReply(id="agriculture_schemes", label="Agriculture Schemes", message="Show agriculture schemes", priority=MEDIUM)

def make_required_documents() -> InternalQuickReply:
    return InternalQuickReply(id="required_documents", label="Required Documents", message="What documents are required?", priority=HIGH)

def make_open_schemes() -> InternalQuickReply:
    return InternalQuickReply(id="open_schemes", label="Open Schemes", message="Show open schemes", priority=MEDIUM)

def make_profile_summary() -> InternalQuickReply:
    return InternalQuickReply(id="profile_summary", label="Profile Summary", message="Show my profile summary", priority=MEDIUM)

def make_upload_history() -> InternalQuickReply:
    return InternalQuickReply(id="upload_history", label="Upload History", message="Show my upload history", priority=MEDIUM)

def get_registry() -> Dict[Intent, Callable[[], List[InternalQuickReply]]]:
    """
    Returns a mapping of intents to a function that builds a fresh baseline list of quick replies.
    We use lambdas/callables to instantiate freshly.
    """
    return {
        Intent.GREETING: lambda: [
            make_my_documents(),
            make_active_schemes(),
            make_check_eligibility()
        ],
        Intent.DOCUMENT_STATUS: lambda: [
            make_expiring_documents(),
            make_upload_document(),
            make_verified_documents()
        ],
        Intent.ACTIVE_SCHEMES: lambda: [
            make_check_eligibility(),
            make_government_scholarships(),
            make_agriculture_schemes()
        ],
        Intent.ELIGIBILITY: lambda: [
            make_required_documents(),
            make_open_schemes(),
            make_profile_summary()
        ],
        Intent.PROFILE_SUMMARY: lambda: [
            make_my_documents(),
            make_upload_history(),
            make_active_schemes()
        ],
        Intent.UNSUPPORTED: lambda: []
    }
