from typing import List, Dict
from app.copilot.types import Intent
from .suggestion_types import InternalAction

def get_registry() -> Dict[Intent, List[InternalAction]]:
    # Reusable Actions
    EXPLORE_SCHEMES = InternalAction(type="open_schemes", label="Explore Schemes", priority=1)
    VIEW_SCHEMES_ELIGIBLE = InternalAction(type="open_schemes", label="View Eligible Schemes", priority=1)
    VIEW_SCHEMES = InternalAction(type="open_schemes", label="View Schemes", priority=1)
    VIEW_ALL_SCHEMES = InternalAction(type="open_schemes", label="View All Schemes", priority=1)
    GO_TO_SCHEME_CENTRE = InternalAction(type="open_schemes", label="Go to Scheme Centre", priority=1)

    VIEW_DOCUMENTS = InternalAction(type="open_documents", label="View Documents", priority=2)
    MANAGE_DOCUMENTS = InternalAction(type="open_documents", label="Manage Documents", priority=2)
    VIEW_UPLOADS = InternalAction(type="open_documents", label="View Uploads", priority=2)

    UPLOAD_DOCUMENT = InternalAction(type="upload_document", label="Upload Document", priority=1)
    UPDATE_DOCUMENT = InternalAction(type="upload_document", label="Update Document", priority=1)
    UPLOAD_MISSING_DOCUMENTS = InternalAction(type="upload_document", label="Upload Missing Documents", priority=1)

    COMPLETE_PROFILE = InternalAction(type="complete_profile", label="Complete Profile", priority=1)
    COMPLETE_YOUR_PROFILE = InternalAction(type="complete_profile", label="Complete Your Profile", priority=1)
    UPDATE_PROFILE = InternalAction(type="complete_profile", label="Update Profile", priority=1)

    return {
        Intent.GREETING: [EXPLORE_SCHEMES, VIEW_DOCUMENTS],
        Intent.DOCUMENT_STATUS: [MANAGE_DOCUMENTS],
        Intent.DOCUMENT_REMINDER: [UPDATE_DOCUMENT, VIEW_DOCUMENTS],
        Intent.ACTIVE_SCHEMES: [GO_TO_SCHEME_CENTRE],
        Intent.ELIGIBILITY: [VIEW_SCHEMES_ELIGIBLE],
        Intent.ELIGIBILITY_REASON: [UPDATE_PROFILE, VIEW_ALL_SCHEMES],
        Intent.PROFILE_SUMMARY: [EXPLORE_SCHEMES],
        Intent.APPLICATION_STATISTICS: [VIEW_UPLOADS, VIEW_SCHEMES],
        Intent.APP_HELP: [GO_TO_SCHEME_CENTRE, MANAGE_DOCUMENTS],
        Intent.UNKNOWN: [EXPLORE_SCHEMES, VIEW_DOCUMENTS],
        Intent.UNSUPPORTED: [EXPLORE_SCHEMES, VIEW_DOCUMENTS],
    }
