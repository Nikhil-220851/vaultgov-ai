"""
firebase_admin.py — Server-side Firebase token verification.

Initialises the Firebase Admin SDK once at startup.
Exports a FastAPI dependency `get_current_uid` that validates the
Authorization Bearer token and returns the verified Firebase UID.
"""

import os

import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer_scheme = HTTPBearer(auto_error=False)

_initialized = False


def initialize_firebase() -> None:
    """Call once during application startup."""
    global _initialized
    if _initialized or firebase_admin._apps:
        _initialized = True
        return

    from dotenv import load_dotenv
    load_dotenv()

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")
    project_id = os.getenv("FIREBASE_PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT") or "vaultgov"

    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, options={"projectId": project_id})
        print(f"[Firebase] ✅ Admin SDK initialised from {cred_path} with project ID: {project_id}")
    else:
        # ─── CRITICAL WARNING ─────────────────────────────────────────────────────
        # Service account credentials file not found. Firebase Admin will start in
        # credential-less mode. verify_id_token() MAY FAIL for all authenticated
        # requests, returning HTTP 401 to all mobile clients.
        #
        # FIX: Download your service account JSON from:
        #   Firebase Console → Project vaultgov → Settings → Service Accounts
        #   → Generate new private key → Save as: backend/firebase-service-account.json
        # ─────────────────────────────────────────────────────────────────────────
        print(
            f"\n[Firebase] ❌ CRITICAL: Service account credentials NOT FOUND at '{cred_path}'.\n"
            f"[Firebase]    All authenticated API requests will fail with 401 Unauthorized.\n"
            f"[Firebase]    Fix: Download firebase-service-account.json from Firebase Console\n"
            f"[Firebase]    (Project: {project_id} → Settings → Service Accounts → Generate new private key)\n"
            f"[Firebase]    and place it at: backend/firebase-service-account.json\n"
            f"[Firebase]    Initialising with project ID only as a degraded fallback...\n"
        )
        firebase_admin.initialize_app(options={"projectId": project_id})

    _initialized = True



def verify_firebase_token(token: str) -> dict:
    """
    Verifies a Firebase ID token and returns the decoded claims.
    Raises HTTPException 401 on any failure.
    """
    try:
        decoded = auth.verify_id_token(token)
        return decoded
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


def get_current_uid(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    """
    FastAPI dependency — extracts and verifies the Firebase ID token
    from the Authorization header, returning the verified UID string.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing.",
        )

    # Check if Firebase Admin was properly initialised with credentials
    if not firebase_admin._apps:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Admin SDK is not initialised.",
        )

    decoded = verify_firebase_token(credentials.credentials)
    return decoded["uid"]
