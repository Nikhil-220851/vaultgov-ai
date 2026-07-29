import time
from sqlalchemy.orm import Session
from app.copilot.tools.base_tool import BaseTool
from app.copilot.tools.tool_result import ToolResult
from app.copilot.planner.planner_types import PlannerResult, Intent
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
            Intent.DOCUMENT_EXPIRY,
            Intent.DOCUMENT_RENEWAL
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
        if doc_types_requested:
            target_type = doc_types_requested[0].lower().replace(" ", "")
            
            def doc_match_score(d):
                title = getattr(d, 'title', '').lower().replace(" ", "")
                cat = getattr(d, 'category', '').lower().replace(" ", "")
                if target_type in title or target_type in cat:
                    return 0
                return 1
                
            docs.sort(key=doc_match_score)
            
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
                "has_documents": len(docs) > 0
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
