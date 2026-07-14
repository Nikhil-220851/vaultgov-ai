/**
 * ocr.types.ts
 *
 * Canonical type definitions for the VaultGov AI OCR Extraction Engine.
 * All screens, hooks, and services depend ONLY on these types.
 */

// ─── Confidence ───────────────────────────────────────────────────────────────

export type OCRConfidenceLevel = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unknown';

export interface OCRConfidence {
  score: number; // 0–100
  level: OCRConfidenceLevel;
  reason?: string;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export interface OCRDocumentMetadata {
  /** Auto-detected or derived title */
  detectedTitle: string;
  /** Total pages (always 1 for single image) */
  pageCount: number;
  /** Total character count in extracted text */
  characterCount: number;
  /** Total word count */
  wordCount: number;
  /** Detected language code (e.g. 'en') */
  language: string;
  /** ISO timestamp when extraction completed */
  extractionTimestamp: string;
  /** Image dimensions */
  imageWidth: number;
  imageHeight: number;
  /** File size in bytes */
  imageSize?: number;
  /** Source of the document */
  source: 'camera' | 'gallery';
  /** MIME type */
  mimeType: string;
}

// ─── OCR Result ───────────────────────────────────────────────────────────────

export interface OCRExtractionResult {
  /** Full extracted text with original formatting preserved */
  rawText: string;
  /** Individual lines of text */
  lines: string[];
  /** Confidence analysis */
  confidence: OCRConfidence;
  /** Document metadata */
  metadata: OCRDocumentMetadata;
}

// ─── Processing Stage ─────────────────────────────────────────────────────────

export type OCRProcessingStage =
  | 'validating'
  | 'preprocessing'
  | 'extracting'
  | 'analyzing'
  | 'done'
  | 'error';

export interface OCRProcessingState {
  stage: OCRProcessingStage;
  progress: number; // 0–100
  message: string;
}

// ─── Error ────────────────────────────────────────────────────────────────────

export type OCRErrorCode =
  | 'FILE_NOT_FOUND'
  | 'UNSUPPORTED_FORMAT'
  | 'BLURRED_IMAGE'
  | 'NO_TEXT_DETECTED'
  | 'LOW_LIGHTING'
  | 'LARGE_IMAGE'
  | 'TIMEOUT'
  | 'PERMISSION_DENIED'
  | 'MEMORY_ERROR'
  | 'CORRUPTED_IMAGE'
  | 'UNKNOWN';

export interface OCRError {
  code: OCRErrorCode;
  message: string;
  userMessage: string;
}

// ─── Document Review ─────────────────────────────────────────────────────────

export type DocumentReviewCategory =
  | 'Govt IDs'
  | 'Certificates'
  | 'Education'
  | 'Other';

export interface DocumentReviewData {
  title: string;
  category: DocumentReviewCategory;
  tags: string[];
  extractedText: string;
  editedLines: string[];
  metadata: OCRDocumentMetadata;
  confidence: OCRConfidence;
  imageUri: string;
  source: 'camera' | 'gallery';
}
