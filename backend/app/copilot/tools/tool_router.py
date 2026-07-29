import time
import logging
from typing import List
from sqlalchemy.orm import Session

from app.copilot.tools.tool_registry import ToolRegistry
from app.copilot.tools.tool_result import ToolResult
from app.copilot.planner.planner_types import PlannerResult

logger = logging.getLogger("app.copilot.tools.router")

class ToolRouter:
    """
    Routes Planner requests to the appropriate tools.
    """
    def __init__(self):
        self.registry = ToolRegistry()
        
    def execute_tools(self, db: Session, current_uid: str, planner_result: PlannerResult) -> List[ToolResult]:
        """
        Iterates over all registered tools and executes those that can handle the request.
        """
        results = []
        all_tools = self.registry.get_all_tools()
        checked_tools = []
        executed_tools = []
        errors = []
        
        for tool in all_tools:
            checked_tools.append(tool.name)
            try:
                should_execute = tool.can_handle(planner_result)
            except Exception as e:
                err_msg = f"Tool {tool.name}.can_handle() failed with error: {str(e)}"
                logger.exception(err_msg)
                errors.append(err_msg)
                continue
                
            if should_execute:
                executed_tools.append(tool.name)
                start_time = time.time()
                logger.info(f"Executing tool: {tool.name} for intent: {planner_result.intent.value}")
                
                try:
                    result = tool.execute(db, current_uid, planner_result)
                    
                    # Ensure execution metrics are recorded
                    result.tool_name = tool.name
                    result.execution_time = (time.time() - start_time) * 1000
                    
                    logger.info(f"Tool {tool.name} finished in {result.execution_time:.2f}ms (Success: {result.success})")
                    results.append(result)
                except Exception as e:
                    err_msg = f"Tool {tool.name} failed with error: {str(e)}"
                    logger.exception(err_msg)
                    errors.append(err_msg)
                    # Return a failure result instead of crashing the whole pipeline
                    results.append(ToolResult(
                        success=False,
                        data={},
                        error=str(e),
                        tool_name=tool.name,
                        execution_time=(time.time() - start_time) * 1000
                    ))
                    
        # Improved Structured Logging
        logger.info(
            f"\n--- TOOL ROUTER EXECUTION SUMMARY ---\n"
            f"Planner Intent: {planner_result.intent.value}\n"
            f"Planner Confidence: {planner_result.confidence}\n"
            f"Tools Checked: {checked_tools}\n"
            f"Tools Executed (Order): {executed_tools}\n"
            f"Tool Errors: {errors if errors else 'None'}\n"
            f"-------------------------------------"
        )
                    
        return results
