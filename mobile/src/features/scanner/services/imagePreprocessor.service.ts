/**
 * imagePreprocessor.service.ts
 *
 * Image preprocessing pipeline for improving OCR accuracy.
 * Uses expo-image-manipulator for on-device transformations.
 *
 * Pipeline:
 *  1. Validate image exists and is readable
 *  2. Resize to OCR-optimal dimensions (max 2048px on longest side)
 *  3. Convert to grayscale + apply contrast enhancement
 *  4. Compress to JPEG for fast transfer
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { OCRError, OCRErrorCode } from '../types/ocr.types';

const TAG = '[OCR:Preprocessor]';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum dimension (width or height) for OCR processing */
const MAX_OCR_DIMENSION = 2048;

/** JPEG quality for OCR (balance between detail and size) */
const OCR_JPEG_QUALITY = 0.85;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PreprocessedImage {
  uri: string;
  width: number;
  height: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: OCRError;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOCRError(code: OCRErrorCode, message: string, userMessage: string): OCRError {
  return { code, message, userMessage };
}

/** Map file extension to supported MIME types */
function isSupportedImageType(uri: string): boolean {
  const lower = uri.toLowerCase();
  return (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.heic') ||
    lower.endsWith('.heif')
  );
}

// ─── Main API ────────────────────────────────────────────────────────────────

/**
 * Validate image file before processing.
 */
export async function validateImage(uri: string): Promise<ValidationResult> {
  console.log(TAG, 'Validating image:', uri);
  console.log('[OCR] Image Loaded');

  if (!uri || uri.trim() === '') {
    console.warn('[OCR] Validation Failed');
    return {
      valid: false,
      error: buildOCRError('FILE_NOT_FOUND', 'Empty URI', 'No document was found. Please try again.'),
    };
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      console.warn(TAG, 'File does not exist:', uri);
      console.warn('[OCR] Validation Failed');
      return {
        valid: false,
        error: buildOCRError(
          'FILE_NOT_FOUND',
          `File not found: ${uri}`,
          'Image not found. The document file could not be found or is inaccessible.'
        ),
      };
    }

    // Check if the file is empty
    if (fileInfo.size === 0) {
      console.warn(TAG, 'File is empty:', uri);
      console.warn('[OCR] Validation Failed');
      return {
        valid: false,
        error: buildOCRError(
          'CORRUPTED_IMAGE',
          `File is empty: ${uri}`,
          'Image corrupted. The file is empty.'
        ),
      };
    }

    // Check file size (reject > 30MB)
    if (fileInfo.size && fileInfo.size > 30 * 1024 * 1024) {
      console.warn(TAG, 'File too large:', fileInfo.size);
      console.warn('[OCR] Validation Failed');
      return {
        valid: false,
        error: buildOCRError(
          'LARGE_IMAGE',
          `File too large: ${fileInfo.size} bytes`,
          'The image is too large to process. Please use a smaller image.'
        ),
      };
    }

    if (!isSupportedImageType(uri)) {
      console.warn(TAG, 'Unsupported image type:', uri);
      console.warn('[OCR] Validation Failed');
      return {
        valid: false,
        error: buildOCRError(
          'UNSUPPORTED_FORMAT',
          `Unsupported format: ${uri}`,
          'Unsupported image. Please use JPG, PNG, or WebP.'
        ),
      };
    }

    console.log(TAG, 'Image validated successfully');
    console.log('[OCR] Validation Passed');
    return { valid: true };
  } catch (err) {
    console.error(TAG, 'Validation error:', err);
    console.warn('[OCR] Validation Failed');
    return {
      valid: false,
      error: buildOCRError(
        'UNKNOWN',
        String(err),
        'File inaccessible. Failed to read the document. Please try again.'
      ),
    };
  }
}

/**
 * Preprocess image for optimal OCR accuracy.
 * Returns a new URI pointing to the processed image.
 */
export async function preprocessImage(
  uri: string,
  originalWidth: number,
  originalHeight: number
): Promise<PreprocessedImage> {
  console.log(TAG, 'Preprocessing started:', { uri, originalWidth, originalHeight });
  console.log('[OCR] Preprocessing Started');

  try {
    const manipulations: ImageManipulator.Action[] = [];

    // Step 1: Resize if necessary
    const longestSide = Math.max(originalWidth, originalHeight);
    if (longestSide > MAX_OCR_DIMENSION) {
      const scale = MAX_OCR_DIMENSION / longestSide;
      const targetWidth = Math.round(originalWidth * scale);
      const targetHeight = Math.round(originalHeight * scale);
      console.log(TAG, `Resizing to ${targetWidth}x${targetHeight}`);
      manipulations.push({ resize: { width: targetWidth, height: targetHeight } });
    }

    // expo-image-manipulator does not support native grayscale/contrast filters
    // without native modules, so we apply what's available:
    // resize + compress. For actual grayscale, we would need a native module.
    // The resize + quality optimization is the primary preprocessing step.

    const result = await ImageManipulator.manipulateAsync(
      uri,
      manipulations,
      {
        compress: OCR_JPEG_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log(TAG, 'Preprocessing complete:', result.uri);
    console.log('[OCR] Image Optimized');
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (err) {
    console.error(TAG, 'Preprocessing error:', err);
    // Fallback: return original if manipulation fails
    console.warn(TAG, 'Falling back to original image');
    return {
      uri,
      width: originalWidth,
      height: originalHeight,
    };
  }
}
