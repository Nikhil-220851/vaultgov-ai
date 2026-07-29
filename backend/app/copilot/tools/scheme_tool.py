from sqlalchemy.orm import Session
from app.copilot.tools.base_tool import BaseTool
from app.copilot.tools.tool_result import ToolResult
from app.copilot.planner.planner_types import PlannerResult, Intent, ContextSource
from app.models.scheme import Scheme
from app.copilot.eligibility_engine import EligibilityEngine

class SchemeTool(BaseTool):
    """
    Handles scheme discovery, recommendations, and eligibility checks.
    """
    
    @property
    def name(self) -> str:
        return "SchemeTool"
        
    @property
    def priority(self) -> int:
        return 3
        
    def can_handle(self, planner_result: PlannerResult) -> bool:
        """
        Handles scheme and eligibility intents, or if schemes are requested in needs.
        """
        if planner_result.intent in (Intent.SCHEME_DISCOVERY, Intent.ELIGIBILITY_CHECK):
            return True
        if ContextSource.SCHEMES in planner_result.needs:
            return True
        return False
        
    def execute(self, db: Session, current_uid: str, planner_result: PlannerResult) -> ToolResult:
        """
        Retrieve active schemes and evaluate eligibility if requested.
        Migrated from DataResolver.
        """
        data = {}
        
        # Always fetch active schemes when this tool runs
        schemes = (
            db.query(Scheme)
            .filter(Scheme.status.in_(("Active", "Upcoming", "Closing Soon", "Permanent")))
            .order_by(Scheme.priorityScore.desc())
            .all()
        )
        
        data["schemes"] = {
            "schemes": schemes,
            "count": len(schemes),
            "has_schemes": len(schemes) > 0
        }
        
        # If eligibility check is explicitly requested or intent matches
        if planner_result.intent in (Intent.ELIGIBILITY_CHECK, ) or ContextSource.SCHEMES in planner_result.needs:
            # Note: EligibilityEngine handles caching and user record lookup
            result = EligibilityEngine.evaluate_all(db, current_uid)
            data["eligibility"] = result
            
        return ToolResult(
            success=True,
            data=data,
            metadata={"scheme_count": len(schemes)}
        )
