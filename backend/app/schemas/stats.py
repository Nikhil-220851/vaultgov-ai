from typing import List

from pydantic import BaseModel

from app.schemas.document import DocumentResponse


class StatsResponse(BaseModel):
    total_documents: int
    total_categories: int
    storage_used_bytes: int
    recent_uploads: List[DocumentResponse]
