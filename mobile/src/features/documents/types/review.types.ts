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
}

export interface IngestionResult {
  reviewModel: ReviewModel;
  processingTime: number;
}
