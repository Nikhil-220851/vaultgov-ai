"""
scheme.py — Pydantic schemas for the Scheme API.

SchemeResponse      : returned to all authenticated users (read-only).
SchemeCreate        : admin-only creation payload.
SchemeUpdate        : admin-only full/partial update (all fields optional).
DeadlineUpdate      : admin-only patch for applicationEnd only.
BenefitsUpdate      : admin-only patch for benefits list only.
EligibilityUpdate   : admin-only patch for eligibility text and criteria.
SchemeSyncResponse  : delta-sync payload returned by /sync.
SchemeSearchResponse: paginated search results.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


# ─── Shared fields ────────────────────────────────────────────────────────────

class SchemeResponse(BaseModel):
    # Identity
    schemeId:             str
    title:                str
    subtitle:             Optional[str]     = None
    description:          str

    # Classification
    category:             str
    subcategory:          Optional[str]     = None

    # Content
    benefits:             List[str]
    eligibility:          str
    requiredDocuments:    List[str]
    recommendedDocuments: List[str]

    # Eligibility Criteria
    gender:               str
    occupation:           str
    ageRange:             str
    incomeLimit:          str
    education:            str              = "Any"
    state:                str
    district:             Optional[str]    = None

    # Application
    applicationMode:      str
    applicationStart:     str
    applicationEnd:       str
    status:               str

    # Official Links
    officialWebsite:      str
    officialApplyLink:    str
    officialNotification: Optional[str]   = None

    # Provenance
    ministry:             str
    launchYear:           int

    # Source Metadata (Verified badge)
    sourceName:           Optional[str]   = None
    sourceURL:            Optional[str]   = None
    verifiedBy:           Optional[str]   = None
    verificationDate:     Optional[str]   = None

    # Versioning / Sync
    version:              int
    contentHash:          Optional[str]   = None
    lastUpdated:          str
    lastVerified:         str

    # Discovery
    priorityScore:        int
    tags:                 List[str]

    model_config = {"from_attributes": True}


# ─── Admin write schemas ──────────────────────────────────────────────────────

class SchemeCreate(BaseModel):
    schemeId:             str
    title:                str
    subtitle:             Optional[str]     = None
    description:          str
    category:             str
    subcategory:          Optional[str]     = None
    benefits:             List[str]
    eligibility:          str
    requiredDocuments:    List[str]
    recommendedDocuments: List[str]         = Field(default_factory=list)
    gender:               str              = "All"
    occupation:           str              = "Any"
    ageRange:             str              = "All"
    incomeLimit:          str              = "All"
    education:            str              = "Any"
    state:                str              = "All"
    district:             Optional[str]    = None
    applicationMode:      str              = "Online"
    applicationStart:     str
    applicationEnd:       str
    status:               str              = "Active"
    officialWebsite:      str
    officialApplyLink:    str
    officialNotification: Optional[str]   = None
    ministry:             str
    launchYear:           int
    sourceName:           Optional[str]   = None
    sourceURL:            Optional[str]   = None
    verifiedBy:           Optional[str]   = "VaultGov Backend"
    priorityScore:        int             = 5
    tags:                 List[str]       = Field(default_factory=list)


class SchemeUpdate(BaseModel):
    """All fields are optional — send only what changed."""
    title:                Optional[str]     = None
    subtitle:             Optional[str]     = None
    description:          Optional[str]     = None
    category:             Optional[str]     = None
    subcategory:          Optional[str]     = None
    benefits:             Optional[List[str]] = None
    eligibility:          Optional[str]     = None
    requiredDocuments:    Optional[List[str]] = None
    recommendedDocuments: Optional[List[str]] = None
    gender:               Optional[str]     = None
    occupation:           Optional[str]     = None
    ageRange:             Optional[str]     = None
    incomeLimit:          Optional[str]     = None
    education:            Optional[str]     = None
    state:                Optional[str]     = None
    district:             Optional[str]     = None
    applicationMode:      Optional[str]     = None
    applicationStart:     Optional[str]     = None
    applicationEnd:       Optional[str]     = None
    status:               Optional[str]     = None
    officialWebsite:      Optional[str]     = None
    officialApplyLink:    Optional[str]     = None
    officialNotification: Optional[str]     = None
    ministry:             Optional[str]     = None
    launchYear:           Optional[int]     = None
    sourceName:           Optional[str]     = None
    sourceURL:            Optional[str]     = None
    verifiedBy:           Optional[str]     = None
    priorityScore:        Optional[int]     = None
    tags:                 Optional[List[str]] = None


class DeadlineUpdate(BaseModel):
    applicationEnd: str


class BenefitsUpdate(BaseModel):
    benefits: List[str]


class EligibilityUpdate(BaseModel):
    eligibility:  str
    gender:       Optional[str] = None
    occupation:   Optional[str] = None
    ageRange:     Optional[str] = None
    incomeLimit:  Optional[str] = None
    education:    Optional[str] = None
    state:        Optional[str] = None
    district:     Optional[str] = None


# ─── Sync + Search responses ──────────────────────────────────────────────────

class SchemeSyncResponse(BaseModel):
    newSchemes:      List[SchemeResponse]
    updatedSchemes:  List[SchemeResponse]
    archivedSchemes: List[SchemeResponse]
    serverTime:      str
    latestVersion:   int


class SchemeSearchResponse(BaseModel):
    results:    List[SchemeResponse]
    total:      int
    page:       int
    page_size:  int
    total_pages: int
