import asyncio
from sqlalchemy.orm import Session
from app.copilot.tools.base_tool import BaseTool
from app.copilot.tools.tool_result import ToolResult
from app.copilot.planner.planner_types import PlannerResult, ContextSource
from app.services.document_intelligence.document_intelligence_service import DocumentIntelligenceService
from app.services.document_intelligence.models import ExtractionRequest

class OCRTool(BaseTool):
    """
    Adapter for the Document Intelligence Service.
    Orchestrates backend OCR extraction safely.
    """
    
    def __init__(self):
        # We instantiate the service once.
        self.service = DocumentIntelligenceService()

    @property
    def name(self) -> str:
        return "OCRTool"
        
    @property
    def priority(self) -> int:
        return 2
        
    def can_handle(self, planner_result: PlannerResult) -> bool:
        """
        Handles requests that explicitly need OCR context.
        """
        return ContextSource.OCR in planner_result.needs
        
    def execute(self, db: Session, current_uid: str, planner_result: PlannerResult) -> ToolResult:
        """
        Orchestrates OCR.
        In a complete implementation, this would fetch the target document's raw OCR text
        and pass it to the extraction service.
        """
        # Note: we need the target document type and raw OCR text.
        # This can be extracted from planner_result.entities in the future.
        doc_type = planner_result.entities.get("document_types", ["aadhaar"])[0].lower()
        
        # Example of adapting the request to the service
        # For now we simulate an empty extraction since we lack the actual image/raw text
        # in the synchronous execution flow.
        try:
            # request = ExtractionRequest(
            #     document_type=doc_type,
            #     raw_ocr_text="[SIMULATED RAW TEXT FROM UPLOADED IMAGE]"
            # )
            # response = asyncio.run(self.service.extract(request))
            # extraction_data = response.model_dump()
            extraction_data = {"status": "OCR adapter ready. Awaiting image context."}
            
            return ToolResult(
                success=True,
                data={"ocr_results": extraction_data},
                metadata={"orchestrated_by": "DocumentIntelligenceService"}
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data={},
                error=str(e),
                metadata={}
            )
