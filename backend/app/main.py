from fastapi import FastAPI

from app.database.connection import test_connection


app = FastAPI(
    title="VaultGov API",
    version="1.0.0",
)


@app.on_event("startup")
def startup_event():
    test_connection()


@app.get("/")
def root():
    return {
        "message": "VaultGov Backend API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }