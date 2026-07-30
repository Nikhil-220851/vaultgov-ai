# VaultGov AI - Deployment Guide

This document outlines the steps required to prepare, secure, and deploy the VaultGov AI backend and frontend applications to production.

## 1. Prerequisites
- **PostgreSQL** database (minimum v14).
- **Firebase** project for Authentication.
- **Cloudinary** account for secure image hosting.
- **Google Cloud** project with Gemini AI access.
- Server environment (AWS, GCP, DigitalOcean, etc.) with Docker installed.

## 2. Environment Configuration
Create a `.env` file for the backend in production:
```env
PORT=8000
DATABASE_URL=postgresql://user:password@host:port/dbname
FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash
```

For the frontend `.env.production`:
```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## 3. Backend Deployment
We recommend using a containerized environment.

1. Build the Docker image:
   ```bash
   docker build -t vaultgov-backend ./backend
   ```
2. Run the Docker container, mounting the Firebase credentials:
   ```bash
   docker run -d -p 8000:8000 \
     --env-file .env \
     -v /path/to/firebase-credentials.json:/app/firebase-credentials.json \
     vaultgov-backend
   ```
3. Use a reverse proxy like **Nginx** or **Traefik** to handle SSL termination.

## 4. Database Migrations
Ensure the database schema is up-to-date before running the application:
```bash
docker exec -it <container_id> alembic upgrade head
```

## 5. Security Checklist
- [x] All endpoints are protected by Firebase Authentication (`Depends(get_current_uid)`).
- [x] Rate limiting is active on `/copilot/chat` and `/api/uploads`.
- [x] No sensitive API keys are hardcoded in the codebase.
- [x] Cross-origin requests (CORS) are properly restricted in `main.py`.
- [x] Unused modules and debug logs have been removed.

## 6. Observability
Monitor the system using the built-in health endpoints:
- `GET /health` - Service status
- `GET /health/db` - Database connection
- `GET /health/ai` - AI Provider connectivity
- `GET /health/tools` - Tool Registry status

Structured JSON logs are output to stdout and can be ingested by Datadog, ELK, or CloudWatch.
