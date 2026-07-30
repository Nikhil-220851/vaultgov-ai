import time
from sqlalchemy.orm import Session
from app.copilot.tools.base_tool import BaseTool
from app.copilot.tools.tool_result import ToolResult
from app.copilot.types import Intent
from app.copilot.planner.planner_types import PlannerResult
from app.services import user_service, document_service

class DocumentTool(BaseTool):
    """
    Handles all document-related queries for VaultGov Copilot.
    """
    
    @property
    def name(self) -> str:
        return "DocumentTool"
        
    @property
    def priority(self) -> int:
        return 1

        
    def can_handle(self, planner_result: PlannerResult) -> bool:
        """
        Only handles document-related intents.
        """
        return planner_result.intent in (
            Intent.DOCUMENT_STATUS,
            Intent.DOCUMENT_UPLOAD,
            Intent.DOCUMENT_REMINDER,
            Intent.RENEWAL_GUIDE
        )
        
    def execute(self, db: Session, current_uid: str, planner_result: PlannerResult) -> ToolResult:
        """
        Executes document logic. Migrated from DataResolver.
        """
        user = user_service.get_user_by_uid(db, current_uid)
        if not user:
            return ToolResult(
                success=True,
                data={
                    "documents": {"documents": [], "count": 0, "has_documents": False},
                    "expiring_documents": {"documents": [], "count": 0, "has_expiring": False}
                },
                metadata={}
            )
            
        # 1. Fetch all documents
        docs = document_service.get_documents(db, user.id)
        
        # 2. Reorder documents based on requested entity (from chat.py hotfix)
        doc_types_requested = planner_result.entities.get("document_types", [])
        requested_doc_found = None
        if doc_types_requested:
            raw_target = doc_types_requested[0].lower().strip()
            
            # Map synonyms to canonical document names
            synonyms = {
                "aadhar": "aadhaar",
                "uid": "aadhaar",
                "uidai": "aadhaar",
                "pan": "pan card",
                "pancard": "pan card",
                "dl": "driving licence",
                "driving license": "driving licence",
                "license": "driving licence",
                "licence": "driving licence",
                "voter id": "voter card",
                "epic": "voter card",
                "rc": "registration certificate"
            }
            
            # Use mapped canonical name if found, else just original
            target_type = synonyms.get(raw_target, raw_target)
            
            def doc_match_score(d):
                title = getattr(d, 'title', '').lower()
                cat = getattr(d, 'category', '').lower()
                
                # 0 = Exact match in title (Highest rank)
                if title == target_type:
                    return 0
                # 1 = Exact match in category
                if cat == target_type:
                    return 1
                # 2 = Target type is a word/substring in title
                if target_type in title.split() or target_type in title:
                    return 2
                # 3 = Target type is a word/substring in category
                if target_type in cat.split() or target_type in cat:
                    return 3
                # 4 = Synonym exact match
                if raw_target in title or raw_target in cat:
                    return 4
                
                return 99 # No match
                
            docs.sort(key=doc_match_score)
            
            # Determine if we successfully matched a document
            if docs and doc_match_score(docs[0]) < 99:
                requested_doc_found = True
                # Optional: filter out completely non-matching documents from the top subset
                # but returning all docs ordered is fine as UI will pick docs[0].
            else:
                requested_doc_found = False
            
        # 3. Compute expiring documents
        expiring = []
        for d in docs:
            # Phase 5 Smart Vault Engine fields
            status = getattr(d, 'status', None)
            if status in ("EXPIRED", "EXPIRING_SOON"):
                expiring.append(d)
                continue
                
            # Fallback to legacy fields
            if getattr(d, 'visual_state', None) in ("warning", "danger"):
                expiring.append(d)
                continue
            
            expiry_text = getattr(d, 'expiry_text', None)
            if expiry_text:
                lower_text = expiry_text.lower()
                if any(k in lower_text for k in ("expir", "expired", "warn", "danger")):
                    expiring.append(d)
                    
        # 4. Return Data
        data = {
            "documents": {
                "documents": docs,
                "count": len(docs),
                "has_documents": len(docs) > 0,
                "requested_doc_found": requested_doc_found if doc_types_requested else None,
                "requested_doc_type": doc_types_requested[0] if doc_types_requested else None
            },
            "expiring_documents": {
                "documents": expiring,
                "count": len(expiring),
                "has_expiring": len(expiring) > 0
            }
        }
        
        return ToolResult(
            success=True,
            data=data,
            metadata={"user_id": user.id}
        )
