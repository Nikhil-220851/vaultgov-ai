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
  supports_expiry?: boolean;
}

export interface VaultGovStats {
  total_documents: number;
  active_documents: number;
  expired_documents: number;
  expiring_soon: number;
  documents_without_expiry: number;
  average_health_score: number;
  category_breakdown: Record<string, number>;
  expiry_timeline: any[];
  recent_uploads: VaultGovDocument[];
  total_categories?: number; // kept for backwards compatibility
}

// Phase 6: Smart Scheme Intelligence Engine
export interface SchemeRecommendation {
  scheme_id: string;
  scheme_name: string;
  category: string;
  priority: number;
  description: string;
  official_link: string;
  eligibility_notes: string;
  status: 'Eligible' | 'Partially Eligible' | 'Not Eligible';
  health_score: number;
  matched_documents: string[];
  missing_documents: string[];
  expired_documents: string[];
  expiring_soon_documents: string[];
  required_count: number;
  matched_count: number;
  completion_pct: number;
}

export interface RecommendationsSummary {
  total_schemes: number;
  eligible: number;
  partially_eligible: number;
  not_eligible: number;
  top_eligible: string[];
  top_missing: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  document_id: string | null;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  payload: Record<string, any> | null;
  is_read: boolean;
  delivery_status: string;
  push_sent: boolean;
  sent_at: string | null;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface UnreadCountResponse {
  count: number;
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
  // TODO: Remove Auth Debug Log
  console.log(
    `[Auth Debug] getHeaders() called. Token exists: ${!!_authToken}. Prefix: ${_authToken ? _authToken.substring(0, 20) + '...' : 'null'}`
  );
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
 *
 * Special handling for no-body status codes (204, 205, 304):
 *   Returns undefined immediately — never calls response.json() — so DELETE
 *   requests that return 204 No Content do NOT throw SyntaxError and are
 *   never retried by fetchWithRetry.
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
    // TODO: Remove Auth Debug Log
    const authHeader = (options.headers as Record<string, string>)?.['Authorization'];
    console.log(`[Auth Debug] [${requestId}] ${options.method || 'GET'} ${url}`);
    console.log(`[Auth Debug] [${requestId}] Authorization header present: ${!!authHeader}. Value prefix: ${authHeader ? authHeader.substring(0, 27) + '...' : 'MISSING — will get 401'}`);
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

    // No-body responses (204 No Content, 205 Reset Content, 304 Not Modified)
    // must never attempt JSON parsing — there is no body to parse.
    // Without this guard, response.json() throws SyntaxError: Unexpected end of input,
    // which fetchWithRetry misidentifies as a transient failure and retries,
    // causing a second DELETE that hits a now-deleted resource (404).
    const NO_BODY_STATUSES = [204, 205, 304];
    if (NO_BODY_STATUSES.includes(response.status)) {
      console.log(`[RETURN SUCCESS] [${requestId}] ${response.status} No Content — skipping JSON parse.`);
      return undefined as unknown as T;
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

  async validateDocument(payload: { document_type: string; fields: Record<string, string | null> }): Promise<any> {
    return fetchWithRetry<any>(`${API_BASE_URL}/api/v1/documents/validate`, {
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
    return fetchWithRetry<VaultGovStats>(`${API_BASE_URL}/api/v1/dashboard/summary`, {
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
    validation?: any;
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
      validation?: any;
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
    validation?: any;
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
      validation?: any;
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

  // Phase 6: Smart Scheme Intelligence Engine
  async getSchemeRecommendations(category?: string): Promise<SchemeRecommendation[]> {
    const url = category
      ? `${API_BASE_URL}/api/v1/schemes/recommendations?category=${encodeURIComponent(category)}`
      : `${API_BASE_URL}/api/v1/schemes/recommendations`;
    return fetchWithRetry<SchemeRecommendation[]>(url, { method: 'GET', headers: getHeaders() });
  },

  async getRecommendationsSummary(): Promise<RecommendationsSummary> {
    const url = `${API_BASE_URL}/api/v1/schemes/recommendations/summary`;
    return fetchWithRetry<RecommendationsSummary>(url, { method: 'GET', headers: getHeaders() });
  },

  // ─── Notifications ─────────────────────────────────────────────────────────────

  async getNotifications(page: number = 1, pageSize: number = 20, category?: string, unreadOnly: boolean = false): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      unread_only: unreadOnly.toString(),
    });
    if (category) {
      queryParams.append('category', category);
    }
    return fetchWithRetry<NotificationListResponse>(`${API_BASE_URL}/api/v1/notifications/?${queryParams.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return fetchWithRetry<UnreadCountResponse>(`${API_BASE_URL}/api/v1/notifications/unread-count`, {
      method: 'GET',
      headers: getHeaders(),
    });
  },

  async markNotificationRead(id: string): Promise<{ success: boolean; notification?: Notification }> {
    return fetchWithRetry<{ success: boolean; notification?: Notification }>(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean; affected: number }> {
    return fetchWithRetry<{ success: boolean; affected: number }>(`${API_BASE_URL}/api/v1/notifications/read-all`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
  },

  async deleteNotification(id: string): Promise<void> {
    const requestId = generateRequestId();
    await fetchWithRetry<void>(
      `${API_BASE_URL}/api/v1/notifications/${id}`,
      { method: 'DELETE', headers: getHeaders() },
      API_TIMEOUT_MS,
      API_MAX_RETRIES,
      requestId
    );
  },

  async clearAllNotifications(): Promise<{ success: boolean; affected: number }> {
    return fetchWithRetry<{ success: boolean; affected: number }>(`${API_BASE_URL}/api/v1/notifications/clear`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  async registerPushToken(token: string): Promise<{ success: boolean }> {
    return fetchWithRetry<{ success: boolean }>(`${API_BASE_URL}/api/v1/notifications/register-push-token`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token }),
    });
  },
};
