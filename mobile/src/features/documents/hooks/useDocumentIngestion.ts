/**
 * useDocumentIngestion.ts
 *
 * Full ingestion pipeline hook used by DocumentPreviewScreen.
 *
 * Responsibilities:
 *  - Starts OCR immediately when a SelectedFile is provided.
 *  - Manages OCRStatus lifecycle (idle → processing → success/partial/failed).
 *  - Exposes editable fields and updateField() for user corrections.
 *  - Retake: re-opens the correct picker (camera / gallery / pdf) and resets state.
 *  - saveDocument: validates required fields, builds DocumentItem, calls addDocument(),
 *    then navigates to the Docs tab using router.replace (not push) so pressing
 *    Back from Docs does not reopen the completed preview screen.
 *  - isSaving guard prevents double-tap.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SelectedFile, captureWithCamera, pickFromGallery, pickPdfDocument } from '../upload.service';
import { OCRStatus, ExtractedField } from '../services/ocr.service';
import { devOCRAdapter } from '../services/ocr.dev-adapter';
import { mapDocumentTypeToCategory, mapCategoryFieldToCategory } from '../services/document-category.mapper';
import { useDocumentStore } from '../store/useDocumentStore';
import { DocumentItem, VisualState } from '../documents.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseDocumentIngestionReturn {
  /** Current OCR status */
  ocrStatus: OCRStatus;
  /** Extracted (or empty) fields from OCR */
  fields: ExtractedField[];
  /** Update a single field value (for user corrections) */
  updateField: (key: string, value: string) => void;
  /** Re-open the picker for the original source; resets OCR state */
  retake: () => Promise<void>;
  /** Save the document, navigate to Docs tab using replace */
  saveDocument: () => Promise<void>;
  /** True while the save operation is in progress (disable double-tap) */
  isSaving: boolean;
  /** True if all required fields are non-null */
  canSave: boolean;
}

// ─── Field validation ─────────────────────────────────────────────────────────

function allRequiredFieldsFilled(fields: ExtractedField[]): boolean {
  return fields
    .filter((f) => f.required)
    .every((f) => f.value !== null && f.value.trim() !== '');
}

// ─── Build DocumentItem from extracted fields ─────────────────────────────────

function buildDocumentItem(
  fields: ExtractedField[],
  assetUri: string,
): DocumentItem {
  const getValue = (key: string) =>
    fields.find((f) => f.key === key)?.value ?? null;

  const docType = getValue('documentType') ?? 'Document';
  const name = getValue('name');
  const categoryField = getValue('category');

  // Derive category from the 'category' field first, then from document type
  const category = categoryField
    ? mapCategoryFieldToCategory(categoryField)
    : mapDocumentTypeToCategory(docType);

  // Build subtitle from available identifiers
  const identifierField = fields.find(
    (f) =>
      f.key === 'licenseNumber' ||
      f.key === 'aadhaarNumber' ||
      f.key === 'panNumber' ||
      f.key === 'passportNumber' ||
      f.key === 'certificateNumber' ||
      f.key === 'rollNumber',
  );
  const identifier = identifierField?.value;
  const subtitle =
    [identifier, name].filter(Boolean).join(' · ') || 'Added document';

  // Expiry info
  const expiryDate = getValue('expiryDate');
  const expiryText = expiryDate ?? 'Valid';

  // Determine visual state based on expiry
  const state: VisualState = 'info';

  // Derive icon from category
  const iconMap: Record<string, string> = {
    'Govt IDs': 'card-outline',
    Certificates: 'document-text-outline',
    Education: 'school-outline',
    Other: 'document-outline',
  };

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: docType,
    subtitle,
    expiryText,
    category,
    state,
    iconName: iconMap[category] ?? 'document-outline',
    savedAt: new Date().toISOString(),
    assetUri,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentIngestion(
  initialFile: SelectedFile | null,
  onAssetChanged?: (file: SelectedFile) => void,
): UseDocumentIngestionReturn {
  const router = useRouter();
  const { addDocument } = useDocumentStore();

  const [file, setFile] = useState<SelectedFile | null>(initialFile);
  const [ocrStatus, setOcrStatus] = useState<OCRStatus>('idle');
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Prevent OCR from running multiple times for the same file
  const lastOcrUri = useRef<string | null>(null);

  // ── Run OCR whenever the file changes ──────────────────────────────────────
  useEffect(() => {
    if (!file) return;
    if (file.uri === lastOcrUri.current) return; // same file, skip

    lastOcrUri.current = file.uri;
    setOcrStatus('processing');
    setFields([]);

    devOCRAdapter
      .extractDocument(file)
      .then((result) => {
        setFields(result.fields);
        setOcrStatus(result.status);
      })
      .catch((err) => {
        console.error('[useDocumentIngestion] OCR error:', err);
        setFields([]);
        setOcrStatus('failed');
      });
  }, [file]);

  // ── updateField ────────────────────────────────────────────────────────────
  const updateField = useCallback((key: string, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value } : f)),
    );
  }, []);

  // ── retake ─────────────────────────────────────────────────────────────────
  const retake = useCallback(async () => {
    if (!file) return;
    const source = file.source;

    // Reset OCR state immediately
    lastOcrUri.current = null;
    setOcrStatus('idle');
    setFields([]);

    let newFile: SelectedFile | null = null;

    try {
      if (source === 'camera') {
        newFile = await captureWithCamera();
      } else if (source === 'gallery') {
        newFile = await pickFromGallery();
      } else if (source === 'pdf') {
        newFile = await pickPdfDocument();
      }
    } catch (err) {
      console.error('[useDocumentIngestion] Retake error:', err);
    }

    if (newFile) {
      setFile(newFile);
      onAssetChanged?.(newFile);
    }
  }, [file, onAssetChanged]);

  // ── saveDocument ───────────────────────────────────────────────────────────
  const saveDocument = useCallback(async () => {
    if (isSaving) return; // Guard against double-tap

    // Validate required fields
    if (!allRequiredFieldsFilled(fields)) {
      Alert.alert(
        'Required fields missing',
        'Please fill in all required fields before saving.',
        [{ text: 'OK' }],
      );
      return;
    }

    if (!file) {
      Alert.alert('No document', 'No document asset found.', [{ text: 'OK' }]);
      return;
    }

    setIsSaving(true);
    try {
      const doc = buildDocumentItem(fields, file.uri);
      addDocument(doc);

      // Use replace so Back from Docs does not reopen the preview screen
      router.replace('/(tabs)/docs' as any);
    } catch (err) {
      console.error('[useDocumentIngestion] Save error:', err);
      Alert.alert('Save failed', 'An error occurred while saving. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, fields, file, addDocument, router]);

  const canSave = allRequiredFieldsFilled(fields);

  return {
    ocrStatus,
    fields,
    updateField,
    retake,
    saveDocument,
    isSaving,
    canSave,
  };
}
