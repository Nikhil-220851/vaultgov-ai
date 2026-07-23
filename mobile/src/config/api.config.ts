/**
 * api.config.ts — Centralized backend configuration for VaultGov AI.
 *
 * This is the SINGLE source of truth for the backend base URL.
 * All API calls must read from this module — never from process.env directly
 * or from a hardcoded string.
 *
 * How to configure per environment:
 *   • Physical Android/iOS device → set EXPO_PUBLIC_API_URL in mobile/.env to your
 *     machine's LAN IP, e.g. http://192.168.1.x:8000
 *   • Android Emulator              → http://10.0.2.2:8000
 *   • iOS Simulator                 → http://localhost:8000
 *   • Staging / Production          → set EXPO_PUBLIC_API_URL in your CI/CD pipeline
 */

// The fallback is intentionally a LAN address suitable for real device testing.
// Change this if you are running on an emulator.
const FALLBACK_DEV_URL = 'http://10.187.251.52:8000';

export const API_BASE_URL: string = (
  process.env.EXPO_PUBLIC_API_URL ?? FALLBACK_DEV_URL
).replace(/\/$/, '');

/** Maximum milliseconds to wait for any single API call. */
export const API_TIMEOUT_MS = 30_000;

/**
 * Extended timeout for PDF OCR uploads.
 * Tesseract processing on a scanned multi-page PDF can take 30-90 seconds.
 * This timeout is applied only to POST /api/v1/documents/upload-pdf.
 */
export const API_PDF_TIMEOUT_MS = 180_000; // 2 minutes

/**
 * Extended timeout for image uploads to Cloudinary.
 * The chain is: phone → FastAPI → Cloudinary → response.
 * On a real mobile device over WiFi this can take 15-30s for a large image.
 * 60s is a safe upper bound without being an unreasonable UX wait.
 */
export const API_IMAGE_TIMEOUT_MS = 300_000; // 1 minute

/** Number of automatic retries for transient failures (does not retry 4xx). */
export const API_MAX_RETRIES = 2;
