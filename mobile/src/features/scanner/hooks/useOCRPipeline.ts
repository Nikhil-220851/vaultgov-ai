/**
 * useOCRPipeline.ts
 *
 * Core OCR orchestration hook for the scanner feature.
 *
 * Pipeline:
 *  1. Validate image (file exists, readable, supported format)
 *  2. Preprocess image (resize, compress)
 *  3. Run ML Kit OCR
 *  4. Compute confidence + metadata
 *  5. Return typed result for display
 *
 * Exposes processing stage/progress so the loading screen can animate.
 */

import { useState, useCallback, useRef } from 'react';
import {
  OCRProcessingState,
  OCRExtractionResult,
  OCRError,
  OCRErrorCode,
} from '../types/ocr.types';
import { ScannedDocument } from '../types/scanner.types';
import { validateImage, preprocessImage } from '../services/imagePreprocessor.service';
import { runMLKitOCR } from '../services/mlkitOcr.service';

const TAG = '[OCR:Pipeline]';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseOCRPipelineReturn {
  /** Run the full OCR pipeline on the given ScannedDocument */
  runOCR: (file: ScannedDocument) => Promise<OCRExtractionResult | null>;
  /** Current processing state for the loading screen */
  processingState: OCRProcessingState;
  /** Non-null when a pipeline error has occurred */
  error: OCRError | null;
  /** True while pipeline is running */
  isProcessing: boolean;
  /** Reset hook state (for retry) */
  reset: () => void;
}

// ─── Stages with labels ───────────────────────────────────────────────────────

const STAGE_CONFIGS = {
  validating:    { progress: 5,  message: 'Validating document...' },
  preprocessing: { progress: 25, message: 'Preprocessing image...' },
  extracting:    { progress: 55, message: 'Extracting text...' },
  analyzing:     { progress: 85, message: 'Analyzing content...' },
  done:          { progress: 100, message: 'Complete!' },
  error:         { progress: 0,  message: 'An error occurred' },
} as const;

const INITIAL_STATE: OCRProcessingState = {
  stage: 'validating',
  progress: 0,
  message: 'Scanning document...',
};

function buildOCRError(code: OCRErrorCode, message: string, userMessage: string): OCRError {
  return { code, message, userMessage };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useOCRPipeline(): UseOCRPipelineReturn {
  const [processingState, setProcessingState] = useState<OCRProcessingState>(INITIAL_STATE);
  const [error, setError] = useState<OCRError | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortRef = useRef(false);

  const updateStage = useCallback((stage: OCRProcessingState['stage']) => {
    const config = STAGE_CONFIGS[stage];
    setProcessingState({ stage, progress: config.progress, message: config.message });
  }, []);

  const reset = useCallback(() => {
    abortRef.current = false;
    setProcessingState(INITIAL_STATE);
    setError(null);
    setIsProcessing(false);
  }, []);

  const runOCR = useCallback(async (file: ScannedDocument): Promise<OCRExtractionResult | null> => {
    abortRef.current = false;
    setIsProcessing(true);
    setError(null);
    setProcessingState(INITIAL_STATE);

    try {
      // ── Step 1: Validate ───────────────────────────────────────────────────
      updateStage('validating');
      console.log(TAG, 'Image Loaded:', file.uri);

      const validation = await validateImage(file.uri);
      if (!validation.valid || abortRef.current) {
        const err = validation.error ?? buildOCRError('UNKNOWN', 'Validation failed', 'Failed to validate image.');
        setError(err);
        updateStage('error');
        setIsProcessing(false);
        return null;
      }

      // ── Step 2: Preprocess ─────────────────────────────────────────────────
      updateStage('preprocessing');
      console.log(TAG, 'Preprocessing Started');

      let processedUri = file.uri;
      let processedWidth = file.width;
      let processedHeight = file.height;

      try {
        const preprocessed = await preprocessImage(file.uri, file.width, file.height);
        if (!abortRef.current) {
          processedUri = preprocessed.uri;
          processedWidth = preprocessed.width;
          processedHeight = preprocessed.height;
          console.log(TAG, 'Preprocessing complete:', processedUri);
        }
      } catch (preprocessErr) {
        console.warn(TAG, 'Preprocessing failed, using original:', preprocessErr);
        // Non-fatal: continue with original image
      }

      if (abortRef.current) {
        setIsProcessing(false);
        return null;
      }

      // ── Step 3: Run OCR ───────────────────────────────────────────────────
      updateStage('extracting');
      console.log(TAG, 'OCR Started');

      const processedFile: ScannedDocument = {
        ...file,
        width: processedWidth,
        height: processedHeight,
      };

      let result: OCRExtractionResult;
      try {
        result = await runMLKitOCR(processedUri, processedFile);
      } catch (ocrErr: any) {
        console.error(TAG, 'OCR engine error:', ocrErr);

        // Interpret error into friendly messages
        let code: OCRErrorCode = 'UNKNOWN';
        let userMessage = 'Could not extract text from this image. Please try again.';

        const msg = String(ocrErr?.message ?? ocrErr).toLowerCase();
        if (msg.includes('memory') || msg.includes('out of mem')) {
          code = 'MEMORY_ERROR';
          userMessage = 'Not enough memory to process this image. Please use a smaller image.';
        } else if (msg.includes('timeout')) {
          code = 'TIMEOUT';
          userMessage = 'OCR timed out. Please try again with a clearer image.';
        } else if (msg.includes('permission')) {
          code = 'PERMISSION_DENIED';
          userMessage = 'Permission denied. Please check app permissions.';
        }

        const ocrError = buildOCRError(code, String(ocrErr), userMessage);
        setError(ocrError);
        updateStage('error');
        setIsProcessing(false);
        return null;
      }

      if (abortRef.current) {
        setIsProcessing(false);
        return null;
      }

      // ── Step 4: Analyze ───────────────────────────────────────────────────
      updateStage('analyzing');
      console.log(TAG, 'OCR Completed');
      console.log(TAG, `Confidence ${result.confidence.score}%`);

      // Check for no-text result
      if (!result.rawText || result.rawText.trim().length === 0) {
        const noTextError = buildOCRError(
          'NO_TEXT_DETECTED',
          'Empty OCR result',
          'No text was found in this image. Make sure the document is clearly visible and well-lit.'
        );
        setError(noTextError);
        updateStage('error');
        setIsProcessing(false);
        return null;
      }

      // ── Step 5: Done ──────────────────────────────────────────────────────
      updateStage('done');
      setIsProcessing(false);
      console.log(TAG, 'Pipeline complete. Lines extracted:', result.lines.length);
      return result;

    } catch (unexpectedErr) {
      console.error(TAG, 'Unexpected pipeline error:', unexpectedErr);
      const err = buildOCRError('UNKNOWN', String(unexpectedErr), 'An unexpected error occurred. Please try again.');
      setError(err);
      updateStage('error');
      setIsProcessing(false);
      return null;
    }
  }, [updateStage]);

  return { runOCR, processingState, error, isProcessing, reset };
}
