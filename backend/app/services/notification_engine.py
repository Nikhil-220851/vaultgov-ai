from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.document import Document
from app.models.notification import Notification

class NotificationEngine:
    def generate_expiry_notifications(self, db: Session):
        """
        Runs daily to generate notification records for documents that are expiring soon or expired.
        Checks for 90, 60, 30, 15, 7, 1 days and EXPIRED.
        """
        now = datetime.now(timezone.utc)
        
        # Get documents that support expiry and have an expiry date
        docs = db.query(Document).filter(
            Document.supports_expiry == True,
            Document.expiry_date.isnot(None),
            Document.notification_enabled == True
        ).all()
        
        for doc in docs:
            delta_days = (doc.expiry_date - now).days
            
            notification_type = None
            message = ""
            priority = "LOW"
            
            if delta_days < 0:
                notification_type = "EXPIRED"
                message = f"Your {doc.title} expired {abs(delta_days)} days ago."
                priority = "CRITICAL"
            elif delta_days in [1, 7, 15, 30, 60, 90]:
                notification_type = "EXPIRING_SOON"
                message = f"Your {doc.title} expires in {delta_days} days."
                priority = "HIGH" if delta_days <= 15 else ("MEDIUM" if delta_days <= 30 else "LOW")
                
            if notification_type:
                # Check if this exact notification already exists for today to avoid duplicates
                # For simplicity, we just check if a notification of same type and document exists in last 24h
                cutoff = now - timedelta(hours=24)
                existing = db.query(Notification).filter(
                    Notification.document_id == doc.id,
                    Notification.type == notification_type,
                    Notification.created_at >= cutoff
                ).first()
                
                if not existing:
                    notif = Notification(
                        user_id=doc.user_id,
                        document_id=doc.id,
                        type=notification_type,
                        title=f"Document {notification_type.replace('_', ' ').title()}",
                        message=message,
                        priority=priority
                    )
                    db.add(notif)
        
        db.commit()

notification_engine = NotificationEngine()
