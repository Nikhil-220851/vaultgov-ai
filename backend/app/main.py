from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.users import router as users_router
from app.core.firebase_admin import initialize_firebase
from app.database.connection import test_connection


app = FastAPI(
    title="VaultGov API",
    version="1.0.0",
    description="Backend API for VaultGov AI — Citizen Document Portal",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allow Expo dev client + any future web deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(users_router, prefix="/api/v1")


# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup_event() -> None:
    test_connection()
    initialize_firebase()


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/")
def root() -> dict:
    return {"message": "VaultGov Backend API is running"}


@app.get("/health")
def health() -> dict:
    return {"status": "healthy"}