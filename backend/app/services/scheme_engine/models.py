"""
models.py — Pydantic data models for the Scheme Intelligence Engine.

These models are the canonical data contracts between:
  SchemeRegistry → EligibilityEngine → SchemeEngine → API
"""
from typing import List, Optional
from pydantic import BaseModel


class SchemeDefinition(BaseModel):
    """A scheme as loaded from a JSON registry file."""
    scheme_id: str
    display_name: str
    description: str
    category: str
    priority: int = 5
    required_documents: List[str]          # template_ids that are required
    optional_documents: List[str] = []    # template_ids that are helpful
    eligibility_notes: str = ""
    official_link: str = ""


class DocumentSnapshot(BaseModel):
    """
    A read-only projection of a vault Document used by the eligibility engine.
    Created from the ORM Document model — never touches the DB again.
    """
    id: str
    title: str
    template_id: Optional[str]            # matches template_id in scheme required_documents
    category: Optional[str]
    status: Optional[str]                 # ACTIVE | EXPIRING_SOON | EXPIRED | NO_EXPIRY | INVALID_DATE
    health_score: Optional[float]
    renewal_priority: Optional[str]


class EligibilityStatus:
    ELIGIBLE = "Eligible"
    PARTIAL = "Partially Eligible"
    NOT_ELIGIBLE = "Not Eligible"


class SchemeRecommendation(BaseModel):
    """The result for a single scheme after eligibility evaluation."""
    scheme_id: str
    scheme_name: str
    category: str
    priority: int
    description: str
    official_link: str
    eligibility_notes: str

    # Eligibility verdict
    status: str                           # Eligible | Partially Eligible | Not Eligible
    health_score: float                   # 0–100 readiness score

    # Document breakdown
    matched_documents: List[str]          # display names of matched docs
    missing_documents: List[str]          # template_ids of missing docs
    expired_documents: List[str]          # display names of expired docs
    expiring_soon_documents: List[str]    # display names expiring in ≤30 days

    # Completion metadata
    required_count: int
    matched_count: int
    completion_pct: float                 # matched_count / required_count * 100
