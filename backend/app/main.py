from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.users import router as users_router
from app.api.documents import router as documents_router
from app.api.stats import router as stats_router
from app.api.uploads import router as uploads_router
from app.api.schemes import router as schemes_router
from app.api.dashboard import router as dashboard_router
from app.api.scheme_recommendations import router as scheme_recommendations_router
from app.api.conversations import router as conversations_router
from app.copilot.chat import router as copilot_router
from app.ai.router import router as ai_router
from app.api.notifications import router as notifications_router
from app.core.firebase_admin import initialize_firebase
from app.database.connection import test_connection, DATABASE_URL
from app.services.scheme_sync_job import SyncScheduler
from app.services.notification_scheduler import NotificationScheduler

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
app.include_router(documents_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")
app.include_router(uploads_router, prefix="/api/v1")
app.include_router(schemes_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(scheme_recommendations_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api")
app.include_router(copilot_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(notifications_router, prefix="/api/v1")

# ─── Schedulers ────────────────────────────────────────────────────────────────
scheduler = SyncScheduler(DATABASE_URL)
notification_scheduler = NotificationScheduler(DATABASE_URL)


# ─── Startup & Shutdown ────────────────────────────────────────────────────────
@app.on_event("startup")
def startup_event() -> None:
    test_connection()
    initialize_firebase()

    # ─── Route registration audit ─────────────────────────────────────────────
    # FastAPI stores sub-routers as _IncludedRouter objects in app.routes.
    # We collect all leaf Route objects recursively to find registered paths.
    from fastapi.routing import APIRoute
    from starlette.routing import Route, Mount

    def collect_routes(routes) -> list:
        collected = []
        for route in routes:
            # FastAPI 0.100+ stores included routers as _IncludedRouter dataclass objects.
            # The actual APIRoute children live in route.original_router.routes.
            # The include prefix is stored in route.include_context.prefix (a dataclass field).
            if type(route).__name__ == "_IncludedRouter":
                prefix = getattr(route.include_context, "prefix", "") if hasattr(route, "include_context") else ""
                sub_routes = getattr(route.original_router, "routes", [])
                for sub in sub_routes:
                    if hasattr(sub, "path"):
                        collected.append((prefix + sub.path, getattr(sub, "methods", None)))
            elif hasattr(route, "path"):
                collected.append((route.path, getattr(route, "methods", None)))
        return collected

    all_routes = collect_routes(app.routes)
    print(f"Registered {len(all_routes)} API route(s):")
    schemes_registered = False
    for path, methods in all_routes:
        methods_str = f" [{', '.join(sorted(methods))}]" if methods else ""
        print(f"  {path}{methods_str}")
        if path.startswith("/api/v1/schemes"):
            schemes_registered = True

    if not schemes_registered:
        print("CRITICAL ERROR: Schemes router is NOT registered. "
              "Check that app.include_router(schemes_router, prefix='/api/v1') is present in main.py.")
        raise RuntimeError("Schemes router failed to register. Server cannot start.")

    scheme_count = sum(1 for path, _ in all_routes if path.startswith("/api/v1/schemes"))
    print(f"[OK] Schemes router verified - {scheme_count} scheme endpoints registered.")

    scheduler.start()
    notification_scheduler.start()


@app.on_event("shutdown")
def shutdown_event() -> None:
    scheduler.stop()
    notification_scheduler.stop()


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/")
def root() -> dict:
    return {"message": "VaultGov Backend API is running"}


@app.get("/health")
def health() -> dict:
    return {"status": "healthy"}