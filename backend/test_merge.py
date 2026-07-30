import sys, os
sys.path.append(os.getcwd())

try:
    from app.main import app
    print("FastAPI app loaded successfully without import errors!")
except Exception as e:
    print(f"Error loading app: {e}")

from app.copilot.tools.tool_router import ToolRouter

router = ToolRouter()
tools = [t.name for t in router.registry.get_all_tools()]
print(f"Registered tools: {tools}")

assert "DocumentTool" in tools
assert "SchemeTool" in tools
assert "OCRTool" in tools
assert "NotificationTool" in tools

print("MERGE VALIDATION SUCCESSFUL!")
