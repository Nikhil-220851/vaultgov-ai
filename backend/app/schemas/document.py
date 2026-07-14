from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel


class DocumentCreate(BaseModel):
    title: str
    category: Optional[str] = None
    tags: List[str] = []
    extracted_text: Optional[str] = None
    image_uri: Optional[str] = None
    source: str = "camera"
    confidence_score: Optional[float] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    extracted_text: Optional[str] = None


class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    category: Optional[str]
    tags: List[str]
    extracted_text: Optional[str]
    image_uri: Optional[str]
    source: str
    confidence_score: Optional[float]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
