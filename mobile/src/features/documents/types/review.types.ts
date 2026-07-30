/**
 * review.types.ts
 *
 * Canonical Unified Architecture types for Document Intelligence.
 * Single source of truth — used by DocumentReviewScreen, OCRStatusBanner,
 * DocumentIngestionService, and document-preview route.
 */

export type DocumentCategory =
  | 'Govt IDs'
  | 'Certificates'
  | 'Education'
  | 'Other';

// ─── PDF Progress Stages ──────────────────────────────────────────────────────

export type PdfProgressStage =
  | 'uploading'
  | 'extracting'
  | 'analyzing'
  | 'preparing';

// ─── Validation ───────────────────────────────────────────────────────────────

export type FieldValidationStatus = 'Valid' | 'Warning' | 'Invalid' | 'Missing';

export interface FieldValidationResult {
  status: FieldValidationStatus;
  reason?: string;
}

export interface ValidationResult {
  /** Overall validation score 0–100 */
  score: number;
  /** Whether the overall document is considered valid */
  is_valid: boolean;
  overall_status: 'Valid' | 'Warning' | 'Invalid' | 'Error';
  field_results: Record<string, FieldValidationResult>;
  /** Required fields from the template — provided by the backend ValidationEngine */
  required_fields: string[];
  supports_expiry?: boolean;
}

// ─── Review Model ─────────────────────────────────────────────────────────────

export interface ReviewModel {
  documentTitle: string;
  category: DocumentCategory;
  extractedText: string;
  structuredFields: Record<string, string | null>;
  imageUri: string;
  cloudinaryUrl?: string;
  confidence: number;
  documentType: string;
  source: 'camera' | 'gallery' | 'pdf';
  processingTime?: number;
  /** Validation results from the backend ValidationEngine */
  validation?: ValidationResult;
}

export interface IngestionResult {
  reviewModel: ReviewModel;
  processingTime: number;
}
