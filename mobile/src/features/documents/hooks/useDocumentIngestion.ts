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
 *  - saveDocument: validates required fields, builds API payload, calls apiClient.createDocument(),
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
import { apiClient } from '@/services/api';
import { storageService } from '@/services/storageService';
import { auth } from '@/services/firebase';
import { useStatsStore } from '@/store/useStatsStore';

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

function buildDocumentPayload(
  fields: ExtractedField[],
  assetUri: string,
) {
  const getValue = (key: string) =>
    fields.find((f) => f.key === key)?.value ?? null;

  const docType = getValue('documentType') ?? 'Document';
  const categoryField = getValue('category');

  const category = categoryField
    ? mapCategoryFieldToCategory(categoryField)
    : mapDocumentTypeToCategory(docType);

  const extractedText = fields.map(f => `${f.label}: ${f.value}`).join('\n');

  return {
    title: docType,
    category,
    image_uri: assetUri,
    source: assetUri.includes('camera') ? 'camera' : 'upload',
    extracted_text: extractedText,
    tags: [docType],
    confidence_score: 0.9,
  };
}


// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentIngestion(
  initialFile: SelectedFile | null,
  onAssetChanged?: (file: SelectedFile) => void,
): UseDocumentIngestionReturn {
  const router = useRouter();


  const [file, setFile] = useState<SelectedFile | null>(initialFile);
  const [ocrStatus, setOcrStatus] = useState<OCRStatus>('idle');
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Prevent OCR from running multiple times for the same file
  const lastOcrUri = useRef<string | null>(null);

  const isSavingRef = useRef(false);

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
    if (isSavingRef.current) {
      console.log('[useDocumentIngestion] Save already in progress. Ignoring duplicate request.');
      return;
    }

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

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated.');
      }

      console.log('[useDocumentIngestion] Uploading image to Cloudinary...');
      const downloadUrl = await storageService.uploadDocumentImage(file.uri);

      const payload = buildDocumentPayload(fields, downloadUrl);
      const newDoc = await apiClient.createDocument(payload);
      
      // Update the local store immediately to ensure the UI reflects the upload instantly
      useDocumentStore.getState().addDocument(newDoc);
      
      // Update the dashboard stats
      await useStatsStore.getState().fetchStats();

      // Optionally fetch in the background to ensure sync, but without awaiting
      useDocumentStore.getState().fetchDocuments().catch(console.error);

      // Use replace so Back from Docs does not reopen the preview screen
      router.replace('/(tabs)/docs' as any);
    } catch (err: any) {
      console.error('[useDocumentIngestion] Save error:', err);
      if (err.message && err.message.includes('Network request failed')) {
        Alert.alert('Upload failed', 'No internet connection. Please check your network and try again.', [{ text: 'OK' }]);
      } else if (err.message && err.message.includes('upload')) {
        Alert.alert('Upload failed', 'Image upload failed. Please try again.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Save failed', 'Document upload failed. Please try again.', [{ text: 'OK' }]);
      }
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [fields, file, router]);

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
