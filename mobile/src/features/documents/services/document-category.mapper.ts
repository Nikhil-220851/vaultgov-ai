/**
 * document-category.mapper.ts
 *
 * Maps OCR-detected document type strings to the CategoryType values
 * used throughout My Vault.
 *
 * This is the single source of truth for category mapping.
 * Do not scatter this logic into UI components or the OCR adapter.
 */

import { DocumentCategory } from '../documents.types';

/** Maps a document type string (from OCR result) to the vault's CategoryType. */
export function mapDocumentTypeToCategory(documentType: string): DocumentCategory {
  const normalized = documentType.trim().toLowerCase();

  // Government IDs
  if (
    normalized.includes('driving') ||
    normalized.includes('licence') ||
    normalized.includes('license') ||
    normalized.includes('aadhaar') ||
    normalized.includes('aadhar') ||
    normalized.includes('pan card') ||
    normalized.includes('pan') ||
    normalized.includes('passport') ||
    normalized.includes('voter') ||
    normalized.includes('ration card')
  ) {
    return 'Govt IDs';
  }

  // Certificates
  if (
    normalized.includes('income certificate') ||
    normalized.includes('birth certificate') ||
    normalized.includes('caste certificate') ||
    normalized.includes('domicile') ||
    normalized.includes('certificate')
  ) {
    return 'Certificates';
  }

  // Education
  if (
    normalized.includes('marksheet') ||
    normalized.includes('mark sheet') ||
    normalized.includes('degree') ||
    normalized.includes('diploma') ||
    normalized.includes('school') ||
    normalized.includes('college') ||
    normalized.includes('10th') ||
    normalized.includes('12th')
  ) {
    return 'Education';
  }

  return 'Other';
}

/** Maps the category ExtractedField value (from OCR) to CategoryType. */
export function mapCategoryFieldToCategory(
  categoryFieldValue: string | null,
): DocumentCategory {
  if (!categoryFieldValue) return 'Other';

  const normalized = categoryFieldValue.trim().toLowerCase();
  if (normalized === 'govt ids' || normalized === 'govt id') return 'Govt IDs';
  if (normalized === 'certificates' || normalized === 'certificate') return 'Certificates';
  if (normalized === 'education') return 'Education';
  return 'Other';
}
