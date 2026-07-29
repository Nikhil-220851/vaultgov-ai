from typing import Dict, List
from app.copilot.tools.base_tool import BaseTool

class ToolRegistry:
    """
    Singleton registry for all copilot tools.
    """
    _instance = None
    _tools: Dict[str, BaseTool] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ToolRegistry, cls).__new__(cls)
            cls._instance._init_tools()
        return cls._instance
        
    def _init_tools(self):
        """Initialize and register all tools."""
        self._tools = {}
        
        # Phase 2.2: Register DocumentTool
        from app.copilot.tools.document_tool import DocumentTool
        self.register_tool(DocumentTool())
        
        # Phase 2 Remaining: Register other tools
        from app.copilot.tools.scheme_tool import SchemeTool
        self.register_tool(SchemeTool())
        
        from app.copilot.tools.ocr_tool import OCRTool
        self.register_tool(OCRTool())
        
        from app.copilot.tools.notification_tool import NotificationTool
        self.register_tool(NotificationTool())
        
    def register_tool(self, tool: BaseTool):
        """Register a tool dynamically."""
        self._tools[tool.name] = tool
        
    def get_all_tools(self) -> List[BaseTool]:
        """Return all registered tools, sorted by priority."""
        tools = list(self._tools.values())
        tools.sort(key=lambda t: t.priority)
        return tools
