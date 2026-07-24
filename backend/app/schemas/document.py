from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, field_validator


class DocumentCreate(BaseModel):
    title: str
    category: Optional[str] = None
    tags: List[str] = []
    extracted_text: Optional[str] = None
    image_uri: Optional[str] = None
    source: str = "camera"
    confidence_score: Optional[float] = None
    supports_expiry: Optional[bool] = False

    @field_validator("image_uri", mode="before")
    @classmethod
    def validate_image_uri(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not (v.startswith("http://") or v.startswith("https://") or v.startswith("file://")):
            raise ValueError("image_uri must be a valid HTTP or file URI")
        return v


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
    
    # Phase 5 Fields
    health_score: Optional[float]
    status: Optional[str]
    expiry_date: Optional[datetime]
    renewal_priority: Optional[str]
    last_opened_at: Optional[datetime]
    validated_at: Optional[datetime]
    status_changed_at: Optional[datetime]
    supports_expiry: Optional[bool]
    notification_enabled: Optional[bool]

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
