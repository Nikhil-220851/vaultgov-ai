from fastapi import APIRouter
from pydantic import BaseModel
from app.ai.providers.provider_factory import ProviderFactory

router = APIRouter()

class TestAIRequest(BaseModel):
    message: str

class TestAIResponse(BaseModel):
    reply: str
    provider: str

@router.post("/test-ai", response_model=TestAIResponse)
def test_ai(request: TestAIRequest):
    """
    Temporary endpoint to verify AI Provider connectivity.
    """
    provider = ProviderFactory.get_provider()
    reply = provider.generate_response(request.message)
    return TestAIResponse(reply=reply or "", provider=provider.provider_name)
