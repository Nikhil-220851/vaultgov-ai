import time
from fastapi import Request, HTTPException, status, Depends
from collections import defaultdict
from app.core.firebase_admin import get_current_uid

# Store request timestamps per user_id per endpoint
# Format: { user_id: { endpoint_path: [timestamp1, timestamp2, ...] } }
_RATE_LIMITS = defaultdict(lambda: defaultdict(list))

def rate_limiter(requests: int, window_seconds: int):
    """
    Dependency to enforce rate limits per user_id.
    :param requests: Max number of requests allowed in the window
    :param window_seconds: The time window in seconds
    """
    def _enforce(request: Request, current_uid: str = Depends(get_current_uid)):
        now = time.time()
        path = request.url.path
        
        # Get history for this user and path
        history = _RATE_LIMITS[current_uid][path]
        
        # Remove timestamps older than the window
        history = [ts for ts in history if now - ts < window_seconds]
        
        if len(history) >= requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again later."
            )
            
        history.append(now)
        _RATE_LIMITS[current_uid][path] = history
        return current_uid
        
    return _enforce

# Define common limiters
chat_limiter = Depends(rate_limiter(requests=10, window_seconds=60)) # 10 requests per minute
upload_limiter = Depends(rate_limiter(requests=5, window_seconds=60)) # 5 uploads per minute
