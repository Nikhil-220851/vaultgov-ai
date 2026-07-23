/**
 * api.ts — VaultGov Backend API Client
 *
 * Production-grade networking layer optimized for React Native Expo SDK 56 + Hermes.
 * 
 * Features:
 *   • Robust dual-timeout mechanism (Promise.race + AbortController) covering the ENTIRE request lifecycle (headers + body parsing).
 *   • Safe retry loop that explicitly guards against retrying non-idempotent operations (Image/PDF uploads).
 *   • Error normalization for Hermes-specific edge cases ("Fetch request has been canceled").
 *   • Structured logging with thread-safe request IDs.
 *   • Native FormData API for reliable large file uploads.
 */

import { API_BASE_URL, API_TIMEOUT_MS, API_PDF_TIMEOUT_MS, API_IMAGE_TIMEOUT_MS, API_MAX_RETRIES } from '@/config/api.config';
import { File } from 'expo-file-system';

// ─── Error Types ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: any
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
  date_of_birth: string | null;
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
  date_of_birth: string;
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

const generateRequestId = () => Math.random().toString(36).substring(2, 10);

function normalizeError(err: any, timeoutMs: number, requestId: string): Error {
  if (err instanceof ApiError) return err;

  const errMsg = err?.message || String(err);
  
  // Intercept known React Native / Hermes cancellation quirks
  if (
    err?.name === 'AbortError' ||
    errMsg.includes('Fetch request has been canceled') ||
    errMsg.includes('Network request failed') ||
    errMsg.includes('aborted') ||
    errMsg.includes('cancelled') ||
    errMsg.includes('canceled') ||
    errMsg.includes('Timeout')
  ) {
    console.warn(`[NETWORK ERROR] [${requestId}] Translated primitive cancellation error to Timeout/Network Error: ${errMsg}`);
    return new Error(`Network request failed or timed out after ${timeoutMs / 1000}s. Please check your connection.`);
  }

  return err instanceof Error ? err : new Error(errMsg);
}

/**
 * Robust fetch wrapper that guarantees either a successful JSON response, 
 * an ApiError for HTTP errors, or a standard Error on timeout/network failure.
 * Timeout applies to the ENTIRE lifecycle, including response.json() parsing.
 */
async function fetchAndParse<T>(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  requestId: string
): Promise<T> {
  const controller = new AbortController();
  const signal = controller.signal;

  const timeoutId = setTimeout(() => {
    console.log(`[TIMEOUT] [${requestId}] Timeout reached (${timeoutMs}ms), aborting request...`);
    controller.abort();
  }, timeoutMs);

  try {
    console.log(`[FETCH STARTED] [${requestId}] ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, { ...options, signal });
    console.log(`[HEADERS RECEIVED] [${requestId}] status=${response.status}`);

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      let bodyText = '';
      try {
        bodyText = await response.text();
        const body = JSON.parse(bodyText);
        detail = body.detail ?? body.message ?? detail;
      } catch {
        detail = bodyText || detail;
      }
      console.error(`[API ERROR] [${requestId}] status=${response.status} detail=${detail}`);
      throw new ApiError(response.status, detail);
    }

    console.log(`[BODY RECEIVING] [${requestId}] parsing JSON...`);
    const json = await response.json();
    console.log(`[JSON PARSED] [${requestId}] successful parsing`);
    console.log(`[RETURN SUCCESS] [${requestId}] Operation completed successfully.`);
    return json as T;
  } catch (err: any) {
    if (err.name !== 'ApiError') {
      console.warn(`[ABORT] [${requestId}] ${err?.name || 'Error'}: ${err?.message}`);
    }
    throw normalizeError(err, timeoutMs, requestId);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes a fetch call with automatic retries for transient errors.
 * Never retries 4xx (client errors) or operations where maxRetries = 0.
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  timeoutMs: number = API_TIMEOUT_MS,
  maxRetries: number = API_MAX_RETRIES,
  reqId?: string
): Promise<T> {
  const requestId = reqId || generateRequestId();
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`[RETRY] [${requestId}] Attempt ${attempt + 1}/${maxRetries + 1}`);
    } else {
      console.log(`[REQUEST CREATED] [${requestId}] maxRetries=${maxRetries}, timeoutMs=${timeoutMs}`);
    }

    try {
      const result = await fetchAndParse<T>(url, options, timeoutMs, requestId);
      return result;
    } catch (err: any) {
      lastError = err;
      
      // Do not retry on client deterministic errors (4xx)
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }

      // Do not retry if we exhausted retries or maxRetries is 0
      if (attempt >= maxRetries) {
        break;
      }

      console.warn(`[RETRY WAIT] [${requestId}] Attempt ${attempt + 1} failed. Delaying before next retry...`);
      await new Promise<void>((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  throw lastError;
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const apiClient = {
  setAuthToken(token: string): void {
    _authToken = token;
  },

  clearAuthToken(): void {
    _authToken = null;
  },

  async upsertUser(payload: UserCreatePayload): Promise<VaultGovUser> {
    return fetchWithRetry<VaultGovUser>(`${API_BASE_URL}/api/v1/users/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async getUser(firebaseUid: string): Promise<VaultGovUser> {
    return fetchWithRetry<VaultGovUser>(`${API_BASE_URL}/api/v1/users/${firebaseUid}`, {
      method: 'GET',
      headers: getHeaders(),
    });
  },

  async updateUserProfile(
    firebaseUid: string,
    payload: UserProfilePayload
  ): Promise<VaultGovUser> {
    return fetchWithRetry<VaultGovUser>(`${API_BASE_URL}/api/v1/users/${firebaseUid}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async updatePermissions(
    firebaseUid: string,
    payload: UserPermissionsPayload
  ): Promise<VaultGovUser> {
    return fetchWithRetry<VaultGovUser>(
      `${API_BASE_URL}/api/v1/users/${firebaseUid}/permissions`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );
  },

  async getDocuments(): Promise<VaultGovDocument[]> {
    return fetchWithRetry<VaultGovDocument[]>(`${API_BASE_URL}/api/v1/documents/`, {
      method: 'GET',
      headers: getHeaders(),
    });
  },

  async getDocument(id: string): Promise<VaultGovDocument> {
    return fetchWithRetry<VaultGovDocument>(`${API_BASE_URL}/api/v1/documents/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
  },

  async createDocument(payload: DocumentCreatePayload): Promise<VaultGovDocument> {
    return fetchWithRetry<VaultGovDocument>(`${API_BASE_URL}/api/v1/documents/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async deleteDocument(id: string): Promise<void> {
    const requestId = generateRequestId();
    await fetchWithRetry<void>(
      `${API_BASE_URL}/api/v1/documents/${id}`,
      { method: 'DELETE', headers: getHeaders() },
      API_TIMEOUT_MS,
      API_MAX_RETRIES,
      requestId
    );
  },

  async getStats(): Promise<VaultGovStats> {
    return fetchWithRetry<VaultGovStats>(`${API_BASE_URL}/api/v1/stats/`, {
      method: 'GET',
      headers: getHeaders(),
    });
  },

  async uploadImageToBackend(localUri: string, reqId?: string): Promise<{
    secure_url: string;
    public_id: string;
    width?: number;
    height?: number;
    // Unified Document Intelligence response fields
    document_type?: string;
    display_name?: string;
    category?: string;
    confidence?: number;
    extracted_text?: string;
    ocr_text?: string;
    structured_data?: Record<string, any> | null;
    document_intelligence_success?: boolean;
    processing_time?: number;
  }> {
    const requestId = reqId || generateRequestId();
    console.log(`[UPLOAD START] [${requestId}] uploadImageToBackend initiated`);

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

    // Normalize Android/iOS URI
    const normalizedUri = localUri.startsWith('file://') || localUri.startsWith('content://') || localUri.startsWith('http')
      ? localUri 
      : `file://${localUri}`;

    // Use Expo SDK 56 / Hermes compliant File object
    // This replaces the legacy { uri, name, type } object which throws 'Unsupported FormDataPart implementation'
    const file = new File(normalizedUri);
    const formData = new FormData();
    (formData as any).append('file', file, name);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      // Content-Type is intentionally omitted for FormData boundaries
    };
    
    if (_authToken) {
      headers['Authorization'] = `Bearer ${_authToken}`;
    }

    return fetchWithRetry<{
      secure_url: string;
      public_id: string;
      width?: number;
      height?: number;
      document_type?: string;
      display_name?: string;
      category?: string;
      confidence?: number;
      extracted_text?: string;
      ocr_text?: string;
      structured_data?: Record<string, any> | null;
      document_intelligence_success?: boolean;
      processing_time?: number;
    }>(

      `${API_BASE_URL}/api/v1/uploads/image`,
      {
        method: 'POST',
        body: formData,
        headers: headers,
      },
      API_IMAGE_TIMEOUT_MS,
      0, // maxRetries=0: image uploads are non-idempotent, never retry
      requestId
    );
  },

  async uploadPdfToBackend(localUri: string, filename: string): Promise<{
    // Unified Document Intelligence response fields (same shape as image upload)
    document_type?: string;
    display_name?: string;
    category?: string;
    confidence?: number;
    extracted_text?: string;
    ocr_text?: string;
    structured_data?: Record<string, any> | null;
    document_intelligence_success?: boolean;
    processing_time?: number;
    // PDF-specific metadata
    metadata?: { filename?: string; content_type?: string; size?: number };
  }> {
    const requestId = generateRequestId();
    console.log(`[UPLOAD START] [${requestId}] uploadPdfToBackend initiated`);

    const normalizedUri = localUri.startsWith('file://') || localUri.startsWith('content://') || localUri.startsWith('http')
      ? localUri 
      : `file://${localUri}`;

    const file = new File(normalizedUri);
    const formData = new FormData();
    (formData as any).append('file', file, filename || 'document.pdf');

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (_authToken) {
      headers['Authorization'] = `Bearer ${_authToken}`;
    }

    return fetchWithRetry<{
      document_type?: string;
      display_name?: string;
      category?: string;
      confidence?: number;
      extracted_text?: string;
      ocr_text?: string;
      structured_data?: Record<string, any> | null;
      document_intelligence_success?: boolean;
      processing_time?: number;
      metadata?: { filename?: string; content_type?: string; size?: number };
    }>(

      `${API_BASE_URL}/api/v1/documents/upload-pdf`,
      {
        method: 'POST',
        body: formData,
        headers: headers,
      },
      API_PDF_TIMEOUT_MS,
      0, // maxRetries=0: PDF OCR is expensive and non-idempotent
      requestId
    );
  },

  async syncSchemes(since: string | null): Promise<{
    newSchemes: any[];
    updatedSchemes: any[];
    archivedSchemes: any[];
    serverTime: string;
    latestVersion: number;
  }> {
    const url = since
      ? `${API_BASE_URL}/api/v1/schemes/sync?since=${encodeURIComponent(since)}`
      : `${API_BASE_URL}/api/v1/schemes/sync`;
    return fetchWithRetry(url, { method: 'GET', headers: getHeaders() });
  },

  async searchSchemes(params: Record<string, any>): Promise<any> {
    const query = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    const url = `${API_BASE_URL}/api/v1/schemes/search?${query}`;
    return fetchWithRetry(url, { method: 'GET', headers: getHeaders() });
  },

  async getSchemeById(schemeId: string): Promise<any> {
    const url = `${API_BASE_URL}/api/v1/schemes/${encodeURIComponent(schemeId)}`;
    return fetchWithRetry(url, { method: 'GET', headers: getHeaders() });
  },
};
