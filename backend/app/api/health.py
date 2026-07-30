from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import time
import logging

from app.database.connection import get_db
from app.ai.providers.provider_factory import ProviderFactory
from app.copilot.tools.tool_registry import ToolRegistry

router = APIRouter(prefix="/health", tags=["health"])
logger = logging.getLogger(__name__)

@router.get("")
def health_check():
    """Overall API status."""
    return {"status": "ok", "timestamp": time.time()}

@router.get("/db")
def health_db(db: Session = Depends(get_db)):
    """Validates PostgreSQL connection."""
    try:
        # pool_pre_ping handles this mostly, but we do a simple select
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )

@router.get("/ai")
def health_ai():
    """Pings Gemini provider."""
    try:
        provider = ProviderFactory.get_provider()
        is_healthy = provider.health_check()
        if is_healthy:
            return {"status": "ok", "ai_provider": provider.provider_name}
        else:
            raise Exception("AI Provider returned false for health_check()")
    except Exception as e:
        logger.error(f"AI health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Provider is unavailable"
        )

@router.get("/tools")
def health_tools():
    """Validates Tool Registry state."""
    try:
        registry = ToolRegistry()
        tools = registry.get_all_tools()
        return {
            "status": "ok", 
            "registered_tools_count": len(tools),
            "tools": [t.name for t in tools]
        }
    except Exception as e:
        logger.error(f"Tools health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Tool Registry validation failed"
        )
