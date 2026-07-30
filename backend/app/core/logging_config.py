import logging
import json
import time

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "time": self.formatTime(record, self.datefmt),
            "name": record.name,
            "level": record.levelname,
            "message": record.getMessage(),
        }
        
        # Add extra contextual fields if they exist
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_obj["user_id"] = record.user_id
        if hasattr(record, "conversation_id"):
            log_obj["conversation_id"] = record.conversation_id
        if hasattr(record, "intent"):
            log_obj["intent"] = record.intent
        if hasattr(record, "tool_selected"):
            log_obj["tool_selected"] = record.tool_selected
            
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_obj)

def setup_logging():
    handler = logging.StreamHandler()
    formatter = JSONFormatter()
    handler.setFormatter(formatter)
    
    # Root logger
    root_logger = logging.getLogger()
    # Remove existing handlers
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)
        
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

    # Uvicorn specific loggers to avoid duplication or override
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
