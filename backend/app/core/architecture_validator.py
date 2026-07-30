import sys
import logging
from typing import Type
from pydantic import BaseModel

logger = logging.getLogger("app.core.architecture_validator")

def validate_architecture():
    """
    Validates architectural constraints at startup to prevent recurring bugs.
    Fails fast with sys.exit(1) if constraints are violated.
    """
    logger.info("Running architectural validation...")

    # 1. Ensure only ONE Intent enum exists
    try:
        from app.copilot.types import Intent as CanonicalIntent
    except ImportError:
        logger.error("Canonical Intent not found in app.copilot.types")
        sys.exit(1)

    try:
        # If planner_types has its own Intent (not imported), this will fail or 
        # we can check identity
        from app.copilot.planner.planner_types import Intent as PlannerIntent
        if PlannerIntent is not CanonicalIntent:
            logger.error(
                "ARCHITECTURE VIOLATION: PlannerIntent is not the CanonicalIntent. "
                "There must be only ONE Intent enum."
            )
            sys.exit(1)
    except ImportError:
        # Planner types does not export Intent, this is also fine
        pass
        
    # 2. Ensure ChatResponse.intent uses canonical intent
    from app.copilot.types import ChatResponse
    intent_field = ChatResponse.model_fields.get("intent")
    if intent_field.annotation is not CanonicalIntent:
        logger.error("ARCHITECTURE VIOLATION: ChatResponse.intent is not CanonicalIntent.")
        sys.exit(1)
        
    # 3. Ensure PlannerResult.intent uses canonical intent
    from app.copilot.planner.planner_types import PlannerResult
    planner_intent_field = PlannerResult.model_fields.get("intent")
    if planner_intent_field.annotation is not CanonicalIntent:
        logger.error("ARCHITECTURE VIOLATION: PlannerResult.intent is not CanonicalIntent.")
        sys.exit(1)

    logger.info("Architectural validation passed successfully.")

if __name__ == "__main__":
    validate_architecture()
