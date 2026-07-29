from sqlalchemy.orm import Session
from app.copilot.tools.base_tool import BaseTool
from app.copilot.tools.tool_result import ToolResult
from app.copilot.planner.planner_types import PlannerResult, Intent
from app.services import user_service
from app.models.notification import Notification

class NotificationTool(BaseTool):
    """
    Retrieves and aggregates notifications, reminders, and alerts for the user.
    """
    
    @property
    def name(self) -> str:
        return "NotificationTool"
        
    @property
    def priority(self) -> int:
        return 4
        
    def can_handle(self, planner_result: PlannerResult) -> bool:
        """
        Handles requests related to expiries, renewals, and alerts.
        """
        return planner_result.intent in (
            Intent.DOCUMENT_EXPIRY,
            Intent.DOCUMENT_RENEWAL
        )
        
    def execute(self, db: Session, current_uid: str, planner_result: PlannerResult) -> ToolResult:
        """
        Retrieve existing notifications for the user to format reminders.
        """
        user = user_service.get_user_by_uid(db, current_uid)
        if not user:
            return ToolResult(
                success=True,
                data={"notifications": []},
                metadata={}
            )
            
        # Fetch unread or recent notifications
        notifications = (
            db.query(Notification)
            .filter(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc())
            .limit(20)
            .all()
        )
        
        return ToolResult(
            success=True,
            data={"notifications": notifications},
            metadata={"notification_count": len(notifications)}
        )
