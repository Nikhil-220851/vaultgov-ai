import abc
from typing import AsyncGenerator, Any

class BaseStreamer(abc.ABC):
    """
    Abstract base class for streaming responses to the frontend.
    This serves as the foundation for future SSE (Server-Sent Events) or WebSockets integration.
    """
    
    @abc.abstractmethod
    async def stream_response(self, initial_state: Any) -> AsyncGenerator[str, None]:
        """
        Yields chunks of the response incrementally.
        """
        pass
