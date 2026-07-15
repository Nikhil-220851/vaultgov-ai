/**
 * api.ts — VaultGov Backend API Client
 *
 * Thin typed wrapper around the Fetch API.
 * The base URL is sourced exclusively from @/config/api.config — never defined here.
 *
 * Features:
 *   • Centralized base URL (never duplicated)
 *   • Per-request timeout (API_TIMEOUT_MS)
 *   • Automatic retry for transient failures (5xx / network errors, max API_MAX_RETRIES)
 *   • Bearer token injection via setAuthToken / clearAuthToken
 *   • ApiError class with HTTP status — allows callers to distinguish 404 vs network error
 *
 * Usage:
 *   import { apiClient, ApiError } from '@/services/api';
 *   apiClient.setAuthToken(idToken);
 *   try {
 *     const user = await apiClient.getUser(uid);
 *   } catch (err) {
 *     if (err instanceof ApiError && err.status === 404) { ... }
 *   }
 */

import { API_BASE_URL, API_TIMEOUT_MS, API_MAX_RETRIES } from '@/config/api.config';

// ─── Error Types ──────────────────────────────────────────────────────────────

/**
 * Thrown for all HTTP-level errors (4xx, 5xx).
 * Carries the numeric HTTP status so callers can branch on 404 vs 403 vs 500, etc.
 * Distinct from plain Error which is thrown for network/timeout failures.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultGovUser {
  id: string;
  firebase_uid: string;
  mobile_number: string | null;
  email: string | null;
  full_name: string | null;
  date_of_birth: string | null; // ISO date string "YYYY-MM-DD"
  gender: string | null;
  state: string | null;
  district: string | null;
  occupation: string | null;
  annual_income: string | null;
  profile_completed: boolean;
  onboarding_permissions_seen: boolean;
  aadhaar_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreatePayload {
  firebase_uid: string;
  mobile_number?: string | null;
  email?: string | null;
}

export interface UserProfilePayload {
  full_name: string;
  date_of_birth: string; // "YYYY-MM-DD"
  gender: string;
  state: string;
  district: string;
  occupation: string;
  annual_income: string;
  mobile_number?: string | null;
  email?: string | null;
}

export interface UserPermissionsPayload {
  onboarding_permissions_seen: boolean;
}

export interface VaultGovDocument {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  tags: string[];
  extracted_text: string | null;
  image_uri: string | null;
  source: string;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreatePayload {
  title: string;
  category?: string | null;
  tags?: string[];
  extracted_text?: string | null;
  image_uri?: string | null;
  source?: string;
  confidence_score?: number | null;
}

export interface VaultGovStats {
  total_documents: number;
  total_categories: number;
  storage_used_bytes: number;
  recent_uploads: VaultGovDocument[];
}

// ─── Internal state ───────────────────────────────────────────────────────────

let _authToken: string | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }
  return headers;
}

/**
 * Wraps a fetch promise with an AbortController-based timeout.
 * Throws a plain Error (not ApiError) if the request times out.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`[API fetchWithTimeout] Triggering abort for URL: ${url} (Timeout: ${API_TIMEOUT_MS}ms)`);
    controller.abort();
  }, API_TIMEOUT_MS);

  console.log('[API fetchWithTimeout] Request Details:', {
    url,
    method: options.method ?? 'GET',
    headers: options.headers,
    body: options.body ? String(options.body).substring(0, 200) : null,
    timeoutMs: API_TIMEOUT_MS,
    signalAborted: controller.signal.aborted,
  });

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    console.log('[API fetchWithTimeout] Response received:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
    return response;
  } catch (err: any) {
    console.log('[API fetchWithTimeout] Caught error:', {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
      json: JSON.stringify(err),
      signalAborted: controller.signal.aborted,
    });

    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${API_TIMEOUT_MS / 1000}s. Check your network.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes a fetch call with automatic retries for transient errors.
 * Only retries on network failures or 5xx responses.
 * Never retries 4xx (client errors — they are deterministic and won't change on retry).
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit
): Promise<Response> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= API_MAX_RETRIES; attempt++) {
    try {
      console.log(`[API fetchWithRetry] Attempt ${attempt + 1}/${API_MAX_RETRIES + 1} starting...`);
      const response = await fetchWithTimeout(url, options);

      // Do NOT retry 4xx — those are deterministic client errors (e.g. 404, 403)
      if (response.status >= 400 && response.status < 500) {
        console.log(`[API fetchWithRetry] Client error ${response.status}. Skipping retries.`);
        return response;
      }

      // Retry 5xx (transient server errors)
      if (response.status >= 500 && attempt < API_MAX_RETRIES) {
        console.warn(`[API fetchWithRetry] Attempt ${attempt + 1} failed with HTTP ${response.status}. Retrying...`);
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 800 * (attempt + 1)));
        continue;
      }

      return response;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.log(`[API fetchWithRetry] Attempt ${attempt + 1} caught error:`, {
        name: lastError.name,
        message: lastError.message,
        stack: lastError.stack,
        json: JSON.stringify(lastError),
      });

      if (attempt < API_MAX_RETRIES) {
        console.warn(`[API] Attempt ${attempt + 1} failed: ${lastError.message}. Retrying in ${800 * (attempt + 1)}ms...`);
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 800 * (attempt + 1)));
      }
    }
  }

  throw new Error(
    `Unable to connect to server after ${API_MAX_RETRIES + 1} attempts. ` +
      `Check that your device and backend (${API_BASE_URL}) are on the same network. ` +
      `Original error: ${lastError.message}`
  );
}

/**
 * Parses a response and throws ApiError for HTTP errors, or returns parsed JSON.
 * This is the ONLY place where ApiError is constructed.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail ?? body.message ?? detail;
    } catch {
      // ignore parse errors — keep the status string as the message
    }
    throw new ApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const apiClient = {
  /**
   * Set the Firebase ID token to be sent with every subsequent request.
   * Call this immediately after Firebase authentication succeeds.
   */
  setAuthToken(token: string): void {
    _authToken = token;
  },

  /**
   * Clear the auth token on sign-out.
   */
  clearAuthToken(): void {
    _authToken = null;
  },

  /**
   * POST /api/v1/users
   * Creates a minimal user record in Neon immediately after Firebase auth.
   * Called ONLY from CompleteProfileScreen.handleSubmit — NOT from login screens.
   */
  async upsertUser(payload: UserCreatePayload): Promise<VaultGovUser> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/v1/users/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<VaultGovUser>(response);
  },

  /**
   * GET /api/v1/users/:firebaseUid
   * Fetch the full user profile.
   * Throws ApiError(404) if the user does not exist in Neon yet.
   */
  async getUser(firebaseUid: string): Promise<VaultGovUser> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/v1/users/${firebaseUid}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<VaultGovUser>(response);
  },

  /**
   * PUT /api/v1/users/:firebaseUid
   * Save the Complete Profile form data.
   * Requires the user record to already exist (call upsertUser first).
   */
  async updateUserProfile(
    firebaseUid: string,
    payload: UserProfilePayload
  ): Promise<VaultGovUser> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/v1/users/${firebaseUid}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<VaultGovUser>(response);
  },

  /**
   * PATCH /api/v1/users/:firebaseUid/permissions
   * Mark the Grant Permissions screen as seen.
   */
  async updatePermissions(
    firebaseUid: string,
    payload: UserPermissionsPayload
  ): Promise<VaultGovUser> {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/api/v1/users/${firebaseUid}/permissions`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );
    return handleResponse<VaultGovUser>(response);
  },

  /**
   * GET /api/v1/documents
   * Fetch all documents for the authenticated user.
   */
  async getDocuments(): Promise<VaultGovDocument[]> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/v1/documents/`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<VaultGovDocument[]>(response);
  },

  /**
   * GET /api/v1/documents/:id
   * Fetch a single document by ID.
   */
  async getDocument(id: string): Promise<VaultGovDocument> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/v1/documents/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<VaultGovDocument>(response);
  },

  /**
   * POST /api/v1/documents
   * Create a new document.
   */
  async createDocument(payload: DocumentCreatePayload): Promise<VaultGovDocument> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/v1/documents/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<VaultGovDocument>(response);
  },

  /**
   * DELETE /api/v1/documents/:id
   * Delete a document.
   */
  async deleteDocument(id: string): Promise<void> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/v1/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to delete document');
    }
  },

  /**
   * GET /api/v1/stats
   * Fetch user dashboard stats.
   */
  async getStats(): Promise<VaultGovStats> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/v1/stats/`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<VaultGovStats>(response);
  },

  /**
   * POST /api/v1/uploads/image
   * Upload an image directly to the FastAPI backend.
   */
  async uploadImageToBackend(localUri: string): Promise<{ secure_url: string; public_id: string; width?: number; height?: number }> {
    const extRaw = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    let extension = extRaw;
    let mimeType = 'image/jpeg';

    if (extRaw === 'png') {
      mimeType = 'image/png';
    } else if (extRaw === 'webp') {
      mimeType = 'image/webp';
    } else if (extRaw === 'heic') {
      mimeType = 'image/heic';
    } else if (extRaw === 'jpg' || extRaw === 'jpeg') {
      mimeType = 'image/jpeg';
    } else {
      extension = 'jpg';
    }

    const name = `document_${Date.now()}.${extension}`;

    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: name,
      type: mimeType,
    } as any);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (_authToken) {
      headers['Authorization'] = `Bearer ${_authToken}`;
    }

    // Notice we do NOT set Content-Type so fetch can auto-generate the boundary
    const response = await fetchWithRetry(`${API_BASE_URL}/api/v1/uploads/image`, {
      method: 'POST',
      body: formData,
      headers: headers,
    });

    return handleResponse<{ secure_url: string; public_id: string; width?: number; height?: number }>(response);
  },
};
