from typing import Dict, Any, List, Callable
from app.copilot.types import Intent
from .card_types import CopilotCard

CardBuilderFunc = Callable[[Dict[str, Any]], List[CopilotCard]]

def _build_document_cards(metadata: Dict[str, Any]) -> List[CopilotCard]:
    docs_meta = metadata.get("documents", {})
    documents = docs_meta.get("documents", [])
    return [CopilotCard(type="document", data=doc) for doc in documents]

def _build_scheme_cards(metadata: Dict[str, Any]) -> List[CopilotCard]:
    schemes_meta = metadata.get("schemes", {})
    schemes = schemes_meta.get("schemes", [])
    return [CopilotCard(type="scheme", data=scheme) for scheme in schemes]

def _build_expiring_document_cards(metadata: Dict[str, Any]) -> List[CopilotCard]:
    rem_res = metadata.get("expiring_documents", {})
    documents = rem_res.get("documents", [])
    return [CopilotCard(type="expiring_document", data=doc) for doc in documents]

def get_registry() -> Dict[Intent, CardBuilderFunc]:
    return {
        Intent.DOCUMENT_STATUS: _build_document_cards,
        Intent.ACTIVE_SCHEMES: _build_scheme_cards,
        Intent.DOCUMENT_REMINDER: _build_expiring_document_cards,
    }
