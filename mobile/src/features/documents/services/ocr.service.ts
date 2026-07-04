/**
 * ocr.service.ts
 *
 * Public interface and type definitions for the OCR service boundary.
 *
 * The UI layer depends only on these types — never on any concrete adapter.
 * When a real OCR backend (ML Kit, PaddleOCR, Firebase Cloud Function, etc.)
 * is available, create a production adapter implementing OCRService and swap
 * it in useDocumentIngestion without touching any screen or component.
 */

import { SelectedFile } from '../upload.service';

// ─── Status ──────────────────────────────────────────────────────────────────

/**
 * Lifecycle of an OCR extraction attempt.
 *
 * idle       – no extraction requested yet
 * processing – extraction is in progress
 * success    – all expected fields were extracted
 * partial    – some fields were extracted; others are null
 * failed     – extraction produced no usable data
 */
export type OCRStatus = 'idle' | 'processing' | 'success' | 'partial' | 'failed';

// ─── Field ────────────────────────────────────────────────────────────────────

/**
 * A single extracted (or missing) field from an OCR run.
 *
 * value === null means the field was not detected.
 * The UI should render "Not found" for null values rather than an empty string.
 */
export interface ExtractedField {
  /** Stable machine key used for updates and validation (e.g. 'name', 'expiryDate') */
  key: string;
  /** Human-readable label shown in the UI (e.g. 'Name', 'Expiry date') */
  label: string;
  /** Extracted value, or null if the field was not detected */
  value: string | null;
  /** Whether this field must be non-null before saving */
  required?: boolean;
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface OCRExtractionResult {
  status: 'success' | 'partial' | 'failed';
  /** All field definitions with their extracted values (or null) */
  fields: ExtractedField[];
  /** Raw OCR text output — useful for debugging but never shown as-is to users */
  rawText?: string;
}

// ─── Service interface ────────────────────────────────────────────────────────

/**
 * Replaceable OCR service interface.
 *
 * Any implementation (dev mock, ML Kit, REST endpoint) must satisfy this shape.
 */
export interface OCRService {
  extractDocument(file: SelectedFile): Promise<OCRExtractionResult>;
}
