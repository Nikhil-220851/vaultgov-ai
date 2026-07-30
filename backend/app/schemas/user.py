"""
Pydantic v2 schemas for the User resource.

Separation of concerns:
  UserCreate          — POST /users  (first-login upsert)
  UserProfileUpdate   — PUT  /users/:uid  (complete profile form)
  UserPermissionsUpdate — PATCH /users/:uid/permissions
  UserResponse        — returned from all endpoints
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    firebase_uid: str
    mobile_number: Optional[str] = None
    email: Optional[str] = None


class UserProfileUpdate(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str
    state: str
    district: str
    occupation: str
    annual_income: str
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    profile_image_url: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email_if_present(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if v == "":
                return None
            if "@" not in v:
                raise ValueError("Invalid email format")
        return v

    @field_validator("mobile_number")
    @classmethod
    def clean_mobile_number(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if v == "":
                return None
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("full_name cannot be blank")
        return v.strip()

    @field_validator("gender")
    @classmethod
    def gender_valid(cls, v: str) -> str:
        allowed = {"Male", "Female", "Other", "Prefer not to say"}
        if v not in allowed:
            raise ValueError(f"gender must be one of {allowed}")
        return v


class UserPermissionsUpdate(BaseModel):
    onboarding_permissions_seen: bool

class UserAIPreferencesUpdate(BaseModel):
    memory_enabled: bool
    detailed_responses: bool

class UserAIPreferencesResponse(BaseModel):
    memory_enabled: bool
    detailed_responses: bool
    
    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: UUID
    firebase_uid: str
    mobile_number: Optional[str]
    email: Optional[str]
    full_name: Optional[str]
    date_of_birth: Optional[date]
    gender: Optional[str]
    state: Optional[str]
    district: Optional[str]
    occupation: Optional[str]
    annual_income: Optional[str]
    profile_image_url: Optional[str]
    profile_completed: bool
    onboarding_permissions_seen: bool
    aadhaar_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
