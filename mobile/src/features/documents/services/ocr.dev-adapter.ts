/**
 * ocr.dev-adapter.ts
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  DEV MOCK – NOT PRODUCTION OCR                                       ║
 * ║                                                                      ║
 * ║  No real OCR engine, ML Kit, Tesseract, PaddleOCR, or Firebase       ║
 * ║  Cloud Function currently exists in this project.                    ║
 * ║                                                                      ║
 * ║  This adapter satisfies the OCRService interface for local           ║
 * ║  development and UI testing only.  It must be replaced with a        ║
 * ║  production adapter before shipping.                                 ║
 * ║                                                                      ║
 * ║  It does NOT fabricate realistic personal data.  All values are      ║
 * ║  placeholder strings or null so the "Not found" UI path is tested.   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { OCRService, OCRExtractionResult, ExtractedField } from './ocr.service';
import { SelectedFile } from '../upload.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simulate realistic network/processing latency (1 – 2 s). */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Inspect filename for document-type heuristics. Case-insensitive. */
function detectDocumentType(file: SelectedFile): string | null {
  const name = (file.name ?? '').toLowerCase();
  if (name.includes('license') || name.includes('licence') || name.includes('dl')) {
    return 'Driving license';
  }
  if (name.includes('aadhaar') || name.includes('aadhar')) {
    return 'Aadhaar card';
  }
  if (name.includes('pan')) {
    return 'PAN card';
  }
  if (name.includes('passport')) {
    return 'Passport';
  }
  if (name.includes('income') || name.includes('certificate')) {
    return 'Income certificate';
  }
  if (name.includes('marksheet') || name.includes('mark') || name.includes('grade')) {
    return '10th marksheet';
  }
  return null;
}

// ─── Field templates ──────────────────────────────────────────────────────────

function buildFieldsForDocType(docType: string): ExtractedField[] {
  // All values are null – the "Not found" UI path must render for unrecognised files.
  // For recognised document types we provide field skeletons with null values,
  // clearly signalling that no real OCR was run.
  const base: ExtractedField[] = [
    { key: 'documentType', label: 'Document type', value: docType, required: true },
    { key: 'name',         label: 'Name',          value: null,    required: true },
  ];

  switch (docType) {
    case 'Driving license':
      return [
        ...base,
        { key: 'licenseNumber', label: 'License number', value: null },
        { key: 'expiryDate',    label: 'Expiry date',    value: null },
        { key: 'category',      label: 'Category',       value: 'Govt IDs' },
      ];
    case 'Aadhaar card':
      return [
        ...base,
        { key: 'aadhaarNumber', label: 'Aadhaar number', value: null },
        { key: 'dob',           label: 'Date of birth',  value: null },
        { key: 'category',      label: 'Category',       value: 'Govt IDs' },
      ];
    case 'PAN card':
      return [
        ...base,
        { key: 'panNumber',  label: 'PAN number',    value: null },
        { key: 'fatherName', label: "Father's name", value: null },
        { key: 'category',   label: 'Category',      value: 'Govt IDs' },
      ];
    case 'Passport':
      return [
        ...base,
        { key: 'passportNumber', label: 'Passport number', value: null },
        { key: 'expiryDate',     label: 'Expiry date',      value: null },
        { key: 'nationality',    label: 'Nationality',       value: null },
        { key: 'category',       label: 'Category',          value: 'Govt IDs' },
      ];
    case 'Income certificate':
      return [
        ...base,
        { key: 'certificateNumber', label: 'Certificate number', value: null },
        { key: 'issuedDate',        label: 'Issued date',         value: null },
        { key: 'category',          label: 'Category',            value: 'Certificates' },
      ];
    case '10th marksheet':
      return [
        ...base,
        { key: 'rollNumber',  label: 'Roll number',  value: null },
        { key: 'percentage',  label: 'Percentage',   value: null },
        { key: 'passYear',    label: 'Pass year',     value: null },
        { key: 'category',    label: 'Category',     value: 'Education' },
      ];
    default:
      return [
        ...base,
        { key: 'category', label: 'Category', value: 'Other' },
      ];
  }
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

// DEV MOCK: Replace this export with a production OCRService when ready.
export const devOCRAdapter: OCRService = {
  async extractDocument(file: SelectedFile): Promise<OCRExtractionResult> {
    // PDFs: OCR is not implemented in this dev adapter
    if (file.source === 'pdf' || file.mimeType === 'application/pdf') {
      await delay(1200);
      return {
        status: 'failed',
        fields: [],
        rawText: '',
      };
    }

    await delay(1500);

    const detectedType = detectDocumentType(file);

    if (!detectedType) {
      // Unrecognisable file — return failed result, not fake data
      return {
        status: 'failed',
        fields: [],
        rawText: '',
      };
    }

    const fields = buildFieldsForDocType(detectedType);

    // Determine status: partial because name and number fields are null
    const hasNullRequired = fields.some((f) => f.required && f.value === null);
    const hasNullOptional = fields.some((f) => !f.required && f.value === null);

    const status =
      hasNullRequired ? 'partial' : hasNullOptional ? 'partial' : 'success';

    return { status, fields, rawText: '' };
  },
};
