from abc import ABC, abstractmethod
from sqlalchemy.orm import Session
from app.copilot.tools.tool_result import ToolResult
from app.copilot.planner.planner_types import PlannerResult

class BaseTool(ABC):
    """
    Abstract base class for all VaultGov Copilot tools.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return the unique name of the tool."""
        pass
        
    @property
    def priority(self) -> int:
        """
        Execution priority. Lower number = higher priority.
        Defaults to 10. Override in subclass if needed.
        """
        return 10
        

    @abstractmethod
    def can_handle(self, planner_result: PlannerResult) -> bool:
        """
        Determine if this tool should execute for the given request.
        """
        pass
        
    @abstractmethod
    def execute(self, db: Session, current_uid: str, planner_result: PlannerResult) -> ToolResult:
        """
        Execute the tool's business logic.
        """
        pass
