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
import { auth } from '@/services/firebase';

// ─── Error Types ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText?: string;
  public readonly responseBody?: string;
  public readonly url?: string;
  public readonly method?: string;

  constructor(
    public readonly status: number,
    message: string | object,
    public readonly detail?: any,
    options?: {
      statusText?: string;
      responseBody?: string;
      url?: string;
      method?: string;
    }
  ) {
    let finalMessage = '';
    if (typeof message === 'object' && message !== null) {
      try {
        finalMessage = JSON.stringify(message);
      } catch {
        finalMessage = String(message);
      }
    } else {
      finalMessage = String(message);
    }
    super(finalMessage);
    this.status = status;
    this.statusText = options?.statusText;
    this.responseBody = options?.responseBody;
    this.url = options?.url;
    this.method = options?.method;
    this.name = 'ApiError';

    // Set prototype chain explicitly for TypeScript/ES5 transpilation
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toString(): string {
    const methodPart = this.method ? `${this.method} ` : '';
    const urlPart = this.url ? this.url : '';
    const statusPart = `Status: ${this.status}${this.statusText ? ' ' + this.statusText : ''}`;
    
    let responsePart = '';
    if (this.responseBody) {
      try {
        const parsed = JSON.parse(this.responseBody);
        responsePart = `Response:\n${JSON.stringify(parsed, null, 4)}`;
      } catch {
        responsePart = `Response:\n${this.responseBody}`;
      }
    } else {
      responsePart = `Response:\n{"message": "${this.message}"}`;
    }

    const stackPart = this.stack ? `\n\nStack Trace:\n${this.stack}` : '';

    return `${methodPart}${urlPart}\n\n${statusPart}\n\n${responsePart}${stackPart}`;
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

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
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

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  assistant_data?: any;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
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

  // 1) Proactively check for token freshness before starting the fetch
  if (auth.currentUser) {
    try {
      const freshToken = await auth.currentUser.getIdToken();
      _authToken = freshToken; // update local cache
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${freshToken}`,
      };
    } catch (e) {
      console.warn(`[API] [${requestId}] Failed to get fresh ID token before request:`, e);
    }
  }

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
      
      // 2) Handle 401 Unauthorized forced token refresh
      if (err instanceof ApiError && err.status === 401 && auth.currentUser) {
        console.log(`[AUTH] [${requestId}] 401 received, forcing token refresh...`);
        try {
          const forceRefreshedToken = await auth.currentUser.getIdToken(true);
          _authToken = forceRefreshedToken;
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${forceRefreshedToken}`,
          };
          console.log(`[AUTH] [${requestId}] Token force refreshed successfully. Retrying once...`);
          // Retry exactly once after forced refresh
          return await fetchAndParse<T>(url, options, timeoutMs, requestId);
        } catch (refreshErr) {
          console.error(`[AUTH] [${requestId}] Failed to force refresh token:`, refreshErr);
          throw err; // throw original 401 if refresh fails
        }
      }

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


  /**
   * POST /api/copilot/chat
   * Chat with the VaultGov Copilot.
   */
  async chatWithCopilot(message: string, conversation_id?: string, signal?: AbortSignal): Promise<{
    message: string;
    intent: string;
    confidence: number;
    actions: { type: string; label: string; data?: any }[];
    cards?: any[];
    quick_replies?: any[];
    sources: { type: string; id: string; title: string; url?: string }[];
    metadata: Record<string, any>;
  }> {
    const url = `${API_BASE_URL}/api/copilot/chat`;
    const headers = getHeaders();
    const payload: any = { message };
    if (conversation_id) payload.conversation_id = conversation_id;
    const reqBody = JSON.stringify(payload);
    
    console.log(`[API chatWithCopilot] Request URL: ${url}`);
    console.log('[API chatWithCopilot] Request Headers:', JSON.stringify(headers, null, 2));
    console.log('[API chatWithCopilot] Request Body:', reqBody);
    
    const response = await fetchWithRetry<{
      message: string;
      intent: string;
      confidence: number;
      actions: { type: string; label: string; data?: any }[];
      cards?: any[];
      quick_replies?: any[];
      sources: { type: string; id: string; title: string; url?: string }[];
      metadata: Record<string, any>;
    }>(url, {
      method: 'POST',
      headers: headers,
      body: reqBody,
      signal,
    });
    return response;
  },

  /**
   * GET /api/copilot/conversations
   * Fetch recent conversations for user.
   */
  async getConversations(limit: number = 20, offset: number = 0): Promise<Conversation[]> {
    const url = `${API_BASE_URL}/api/copilot/conversations?limit=${limit}&offset=${offset}`;
    return fetchWithRetry<Conversation[]>(url, {
      method: 'GET',
      headers: getHeaders(),
    });
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

  /**
   * GET /api/copilot/conversations/:id
   * Fetch conversation history by ID.
   */
  async getConversationHistory(id: string): Promise<ConversationWithMessages> {
    const url = `${API_BASE_URL}/api/copilot/conversations/${encodeURIComponent(id)}`;
    return fetchWithRetry<ConversationWithMessages>(url, {
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


  /**
   * PATCH /api/copilot/conversations/:id
   * Rename a conversation.
   */
  async renameConversation(id: string, title: string): Promise<Conversation> {
    const url = `${API_BASE_URL}/api/copilot/conversations/${encodeURIComponent(id)}`;
    return fetchWithRetry<Conversation>(url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ title }),
    });
  },

  /**
   * DELETE /api/copilot/conversations/:id
   * Delete a conversation.
   */
  async deleteConversation(id: string): Promise<void> {
    const url = `${API_BASE_URL}/api/copilot/conversations/${encodeURIComponent(id)}`;
    return fetchWithRetry<void>(url, {
      method: 'DELETE',
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
