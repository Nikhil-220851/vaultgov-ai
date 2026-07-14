/**
 * ocr-processing.tsx  (route: /scan/ocr-processing)
 *
 * Expo Router wrapper for the OCR Processing screen.
 * Manages the 3-screen flow: Processing → Result → Review
 * entirely within this route using local state.
 */

import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScannedDocument } from '@/features/scanner/types/scanner.types';
import {
  OCRExtractionResult,
  DocumentReviewData,
  DocumentReviewCategory,
} from '@/features/scanner/types/ocr.types';
import { OCRProcessingScreen } from '@/features/scanner/screens/OCRProcessingScreen';
import { OCRResultScreen } from '@/features/scanner/screens/OCRResultScreen';
import { DocumentReviewScreen } from '@/features/scanner/screens/DocumentReviewScreen';

// ─── View States ─────────────────────────────────────────────────────────────

type ViewState = 'processing' | 'result' | 'review';

// ─── Route ────────────────────────────────────────────────────────────────────

export default function OCRProcessingRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ── Parse incoming params from /scan/preview ──────────────────────────────
  const uri     = typeof params.uri    === 'string' ? params.uri    : '';
  const name    = typeof params.name   === 'string' ? params.name   : 'document.jpg';
  const width   = params.width   ? Number(params.width)  : 0;
  const height  = params.height  ? Number(params.height) : 0;
  const size    = params.size    ? Number(params.size)   : undefined;
  const source  = (typeof params.source === 'string' ? params.source : 'camera') as 'camera' | 'gallery';
  const mimeType = typeof params.mimeType === 'string' ? params.mimeType : 'image/jpeg';

  const file: ScannedDocument = { uri, name, width, height, size, source, mimeType };

  // ── Local view state (drives which screen renders) ────────────────────────
  const [viewState, setViewState]   = useState<ViewState>('processing');
  const [ocrResult, setOcrResult]   = useState<OCRExtractionResult | null>(null);
  const [editedLines, setEditedLines] = useState<string[]>([]);
  const [key, setKey]               = useState(0); // force remount on retry

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleOCRSuccess = useCallback((result: OCRExtractionResult) => {
    console.log('[OCR] OCR Completed — transitioning to result screen');
    setOcrResult(result);
    setEditedLines(result.lines);
    setViewState('result');
  }, []);

  const handleOCRError = useCallback((message: string) => {
    Alert.alert(
      'OCR Failed',
      message,
      [
        { text: 'Retry', onPress: () => { setKey(k => k + 1); setViewState('processing'); } },
        { text: 'Go Back', style: 'cancel', onPress: () => router.back() },
      ]
    );
  }, [router]);

  const handleCancel = useCallback(() => {
    console.log('[OCR] Cancelled — returning to preview');
    router.back();
  }, [router]);

  const handleRetry = useCallback(() => {
    console.log('[OCR] Retry pressed — restarting pipeline');
    setOcrResult(null);
    setEditedLines([]);
    setKey(k => k + 1);
    setViewState('processing');
  }, []);

  const handleContinueToReview = useCallback((lines: string[]) => {
    console.log('[OCR] Continuing to document review');
    setEditedLines(lines);
    setViewState('review');
  }, []);

  const handleBackToResult = useCallback(() => {
    setViewState('result');
  }, []);

  // ── Build review data ─────────────────────────────────────────────────────

  const buildReviewData = (): DocumentReviewData | null => {
    if (!ocrResult) return null;
    return {
      title:        ocrResult.metadata.detectedTitle,
      category:     inferCategory(ocrResult.metadata.detectedTitle) as DocumentReviewCategory,
      tags:         [],
      extractedText: ocrResult.rawText,
      editedLines,
      metadata:     ocrResult.metadata,
      confidence:   ocrResult.confidence,
      imageUri:     file.uri,
      source:       file.source,
    };
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (viewState === 'processing') {
    return (
      <OCRProcessingScreen
        key={key}
        file={file}
        onSuccess={handleOCRSuccess}
        onError={handleOCRError}
        onCancel={handleCancel}
      />
    );
  }

  if (viewState === 'result' && ocrResult) {
    return (
      <OCRResultScreen
        result={{ ...ocrResult, lines: editedLines }}
        file={file}
        onRetry={handleRetry}
        onDiscard={handleCancel}
        onContinue={handleContinueToReview}
      />
    );
  }

  if (viewState === 'review') {
    const reviewData = buildReviewData();
    if (!reviewData) {
      router.back();
      return null;
    }
    return (
      <DocumentReviewScreen
        reviewData={reviewData}
        onBack={handleBackToResult}
      />
    );
  }

  return null;
}

// ─── Category Heuristic ───────────────────────────────────────────────────────

function inferCategory(title: string): DocumentReviewCategory {
  const t = title.toLowerCase();
  if (t.includes('aadhaar') || t.includes('pan') || t.includes('passport') ||
      t.includes('licence') || t.includes('license') || t.includes('voter')) {
    return 'Govt IDs';
  }
  if (t.includes('certificate') || t.includes('income') || t.includes('birth') ||
      t.includes('caste') || t.includes('domicile')) {
    return 'Certificates';
  }
  if (t.includes('marksheet') || t.includes('degree') || t.includes('school') ||
      t.includes('college') || t.includes('university') || t.includes('result')) {
    return 'Education';
  }
  return 'Other';
}
