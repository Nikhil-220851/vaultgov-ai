/**
 * mlkitOcr.service.ts
 *
 * Production OCR service using @react-native-ml-kit/text-recognition.
 * ML Kit runs fully on-device — no network required, no API key needed.
 *
 * This service:
 *  1. Receives a preprocessed image URI
 *  2. Runs ML Kit Text Recognition
 *  3. Extracts text lines and computes confidence
 *  4. Returns a typed OCRExtractionResult
 */

import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import {
  OCRExtractionResult,
  OCRConfidence,
  OCRConfidenceLevel,
  OCRDocumentMetadata,
} from '../types/ocr.types';
import { ScannedDocument } from '../types/scanner.types';

const TAG = '[OCR:MLKit]';

// ─── Confidence Estimation ────────────────────────────────────────────────────

/**
 * Estimate confidence from raw OCR text.
 * ML Kit does not always expose per-character confidence on RN,
 * so we estimate from heuristics.
 */
function estimateConfidence(text: string, lines: string[]): OCRConfidence {
  if (!text || text.trim().length === 0) {
    return { score: 0, level: 'Poor', reason: 'No text detected' };
  }

  const totalChars = text.length;
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) {
    return { score: 5, level: 'Poor', reason: 'No readable words found' };
  }

  // Heuristic 1: Symbol noise ratio (non-alphanumeric chars that aren't punctuation)
  const noiseChars = (text.match(/[^a-zA-Z0-9\s.,\-:;'"()[\]{}!?@#%&*/\\+=<>|~`_^]/g) || []).length;
  const noiseRatio = noiseChars / Math.max(totalChars, 1);

  // Heuristic 2: Average word length (very short words may indicate noise)
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / wordCount;

  // Heuristic 3: Line continuity (too many single-char lines = noise)
  const singleCharLines = lines.filter(l => l.trim().length === 1).length;
  const lineContinuityPenalty = singleCharLines / Math.max(lines.length, 1);

  // Compute score (0–100)
  let score = 100;
  score -= Math.round(noiseRatio * 60);           // up to -60 for noise
  score -= Math.round(lineContinuityPenalty * 20); // up to -20 for fragmented lines
  if (avgWordLen < 2) score -= 20;                  // -20 for suspiciously short words
  score = Math.max(0, Math.min(100, score));

  let level: OCRConfidenceLevel;
  let reason: string;
  if (score >= 85) {
    level = 'Excellent';
    reason = 'Text extracted with high clarity';
  } else if (score >= 65) {
    level = 'Good';
    reason = 'Most text extracted successfully';
  } else if (score >= 40) {
    level = 'Fair';
    reason = 'Some characters may be inaccurate';
  } else {
    level = 'Poor';
    reason = 'Image may be blurry or poorly lit';
  }

  return { score, level, reason };
}

// ─── Metadata Generation ──────────────────────────────────────────────────────

function detectLanguage(text: string): string {
  // Simple heuristic: if mostly ASCII letters, probably English
  const asciiRatio = (text.match(/[a-zA-Z]/g) || []).length / Math.max(text.length, 1);
  if (asciiRatio > 0.3) return 'en';
  return 'unknown';
}

function detectTitle(lines: string[]): string {
  // Take the first non-empty line that is reasonably short as the title
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length >= 3 && trimmed.length <= 80) {
      return trimmed;
    }
  }
  return 'Scanned Document';
}

function buildMetadata(
  rawText: string,
  lines: string[],
  file: ScannedDocument
): OCRDocumentMetadata {
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  return {
    detectedTitle: detectTitle(lines),
    pageCount: 1,
    characterCount: rawText.length,
    wordCount,
    language: detectLanguage(rawText),
    extractionTimestamp: new Date().toISOString(),
    imageWidth: file.width,
    imageHeight: file.height,
    imageSize: file.size,
    source: file.source,
    mimeType: file.mimeType,
  };
}

// ─── Main OCR Runner ─────────────────────────────────────────────────────────

/**
 * Run ML Kit text recognition on a (preprocessed) image URI.
 */
export async function runMLKitOCR(
  imageUri: string,
  originalFile: ScannedDocument
): Promise<OCRExtractionResult> {
  console.log(TAG, 'OCR Started on:', imageUri);

  try {
    const result = await TextRecognition.recognize(
      imageUri,
      TextRecognitionScript.LATIN
    );

    // Flatten all blocks → lines → elements into line strings
    const lineStrings: string[] = [];
    for (const block of result.blocks) {
      for (const line of block.lines) {
        const lineText = line.elements
          .map(el => el.text)
          .join(' ')
          .trim();
        if (lineText.length > 0) {
          lineStrings.push(lineText);
        }
      }
    }

    const rawText = lineStrings.join('\n');
    console.log(TAG, `OCR Completed. Lines: ${lineStrings.length}, Chars: ${rawText.length}`);

    const confidence = estimateConfidence(rawText, lineStrings);
    const metadata = buildMetadata(rawText, lineStrings, originalFile);

    console.log(TAG, `Confidence: ${confidence.score}% (${confidence.level})`);
    console.log(TAG, 'Saved Result — metadata built');

    return {
      rawText,
      lines: lineStrings,
      confidence,
      metadata,
    };
  } catch (err) {
    console.error(TAG, 'ML Kit OCR error:', err);
    throw err;
  }
}
