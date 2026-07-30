import asyncio
import logging
from typing import Dict, Any

logger = logging.getLogger("app.services.analytics")

class AnalyticsService:
    """
    In-memory async analytics service for tracking AI performance without blocking chat.
    """
    # In-memory counters
    _metrics = {
        "total_requests": 0,
        "gemini_success": 0,
        "gemini_failure": 0,
        "fallback_count": 0,
        "total_latency": 0.0,
        "total_confidence": 0.0,
        "intent_frequency": {},
    }

    @classmethod
    async def log_event(
        cls,
        intent: str,
        latency: float,
        success: bool,
        fallback: bool,
        confidence: float
    ):
        """
        Logs a single chat event asynchronously.
        Never stores user messages.
        """
        # Run the update in a background task to ensure non-blocking
        asyncio.create_task(cls._update_metrics(intent, latency, success, fallback, confidence))

    @classmethod
    async def _update_metrics(cls, intent: str, latency: float, success: bool, fallback: bool, confidence: float):
        try:
            cls._metrics["total_requests"] += 1
            cls._metrics["total_latency"] += latency
            cls._metrics["total_confidence"] += confidence
            
            if success:
                cls._metrics["gemini_success"] += 1
            else:
                cls._metrics["gemini_failure"] += 1
                
            if fallback:
                cls._metrics["fallback_count"] += 1
                
            if intent not in cls._metrics["intent_frequency"]:
                cls._metrics["intent_frequency"][intent] = 0
            cls._metrics["intent_frequency"][intent] += 1
            
            # Periodically log or save to DB here if needed.
            # For now, just keep in memory.
            logger.debug(f"Async Analytics Logged: {intent} in {latency:.2f}s")
        except Exception as e:
            logger.error(f"Error logging analytics: {e}")

    @classmethod
    def get_metrics(cls) -> Dict[str, Any]:
        return cls._metrics
