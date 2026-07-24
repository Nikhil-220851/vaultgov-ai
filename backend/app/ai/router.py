from fastapi import APIRouter
from pydantic import BaseModel
from app.ai.gemini_service import GeminiService

router = APIRouter()

# Single instance for the test endpoint
gemini_service = GeminiService()

class TestGeminiRequest(BaseModel):
    message: str

class TestGeminiResponse(BaseModel):
    reply: str

@router.post("/test-gemini", response_model=TestGeminiResponse)
def test_gemini(request: TestGeminiRequest):
    """
    Temporary endpoint to verify Gemini connectivity.
    """
    reply = gemini_service.generate_response(request.message)
    return TestGeminiResponse(reply=reply)
