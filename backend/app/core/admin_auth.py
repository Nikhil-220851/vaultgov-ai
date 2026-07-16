"""
admin_auth.py — Admin authorization FastAPI dependency.

Uses Firebase custom claims to verify administrator access.
The Firebase custom claim `admin: true` must be set server-side
via the Firebase Admin SDK before a user can use admin endpoints.

To grant admin rights to a user (run once via a management script):
    from firebase_admin import auth
    auth.set_custom_user_claims(uid, {'admin': True})

Normal authenticated users receive HTTP 403 if they call admin endpoints.
"""

import firebase_admin
from firebase_admin import auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer_scheme = HTTPBearer(auto_error=False)


def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    """
    FastAPI dependency that:
    1. Validates the Firebase Bearer token (same as get_current_uid).
    2. Checks for the custom claim `admin: true`.
    3. Returns the admin's Firebase UID if authorised.
    4. Raises HTTP 403 if the user is authenticated but not an admin.
    5. Raises HTTP 401 if the token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing.",
        )

    if not firebase_admin._apps:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Admin SDK is not initialised.",
        )

    try:
        decoded = auth.verify_id_token(credentials.credentials)
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token has expired. Please sign in again.",
        )
    except auth.InvalidIdTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase token: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {exc}",
        )

    # Check for admin custom claim
    claims = decoded.get("admin", False)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required. "
                   "This endpoint is restricted to VaultGov administrators.",
        )

    return decoded["uid"]
