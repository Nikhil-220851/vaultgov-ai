/**
 * review.types.ts
 *
 * Canonical Unified Architecture types for Document Intelligence.
 */

export type DocumentCategory =
  | 'Govt IDs'
  | 'Certificates'
  | 'Education'
  | 'Other';

export type FieldValidationStatus = 'Valid' | 'Warning' | 'Invalid';

export interface FieldValidationResult {
  status: FieldValidationStatus;
  reason?: string;
}

export interface ValidationResult {
  score: number;
  overall_status: 'Valid' | 'Warning' | 'Invalid' | 'Error';
  field_results: Record<string, FieldValidationResult>;
  /** Required fields from the template — provided by the backend ValidationEngine */
  required_fields: string[];
  supports_expiry?: boolean;
}

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
