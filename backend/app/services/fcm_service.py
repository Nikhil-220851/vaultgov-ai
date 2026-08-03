import logging
from typing import Any, Optional
from uuid import UUID

import firebase_admin
from firebase_admin import messaging
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.device_token import DeviceToken
from app.services.notification_service import notification_manager

logger = logging.getLogger(__name__)

class FCMService:
    """
    Firebase Cloud Messaging dispatch service.
    Replaces ExpoPushService for native production setups.
    """

    def send_multicast(
        self,
        db: Session,
        user_id: UUID,
        title: str,
        body: str,
        data: Optional[dict[str, str]] = None,
    ) -> dict[str, Any]:
        """
        Sends an FCM message to all active devices of a user.
        Cleans up tokens that result in UnregisteredError.
        """
        if not firebase_admin._apps:
            logger.error("[FCMService] Firebase Admin SDK is not initialized.")
            return {"success": False, "error": "Firebase not initialized"}

        devices = db.query(DeviceToken).filter(
            DeviceToken.user_id == user_id,
            DeviceToken.is_active == True,
        ).all()

        if not devices:
            return {"success": False, "error": "No active device tokens found"}

        tokens = [d.token for d in devices]

        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    sound="default",
                ),
            )
        )

        try:
            response = messaging.send_each_for_multicast(message)
            logger.info("[FCMService] Sent multicast to %d devices (Success: %d, Failure: %d)",
                        len(tokens), response.success_count, response.failure_count)

            # Cleanup invalid tokens
            if response.failure_count > 0:
                responses = response.responses
                for i, res in enumerate(responses):
                    if not res.success:
                        error_code = res.exception.code if res.exception else "unknown"
                        if error_code in ("messaging/invalid-registration-token", "messaging/registration-token-not-registered"):
                            logger.info(f"[FCMService] Token {tokens[i][:10]}... is invalid. Removing.")
                            notification_manager.remove_device_token(db, tokens[i])

            return {
                "success": response.success_count > 0,
                "success_count": response.success_count,
                "failure_count": response.failure_count
            }
        except Exception as exc:
            logger.error(f"[FCMService] Error sending FCM message: {exc}")
            return {"success": False, "error": str(exc)}

    def dispatch_pending(self, db: Session) -> int:
        """
        Fetches PENDING notifications and dispatches via FCM.
        """
        pending = notification_manager.get_pending_push_notifications(db)
        if not pending:
            return 0
        
        pushed = 0
        for notif in pending:
            # Cast payload values to strings as FCM data only accepts string values
            data = {}
            if notif.payload:
                for k, v in notif.payload.items():
                    data[str(k)] = str(v)
            data["notification_id"] = str(notif.id)

            res = self.send_multicast(db, notif.user_id, notif.title, notif.message, data)
            if res.get("success"):
                notification_manager.mark_push_sent(db, notif.id)
                pushed += 1
            else:
                error = res.get("error", "Unknown FCM error")
                notification_manager.mark_push_failed(db, notif.id, error)
        
        return pushed

fcm_service = FCMService()
