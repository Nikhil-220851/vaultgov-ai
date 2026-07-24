/**
 * DocumentIngestionService.ts
 *
 * Single production-ready entry point for Document Intelligence ingestion.
 *
 * Responsibilities:
 * - Receive document source (Camera / Gallery / PDF)
 * - Perform OCR & backend upload
 * - Perform Gemini structured extraction via FastAPI backend
 * - Map response to ReviewModel
 * - Return ReviewModel
 */

import { Platform } from 'react-native';
import { SelectedFile } from '../upload.service';
import { ReviewModel, DocumentCategory } from '../types/review.types';
import { apiClient } from '@/services/api';
import { runMLKitOCR } from '@/features/scanner/services/mlkitOcr.service';

export class DocumentIngestionService {
  /**
   * Process any document source (Camera, Gallery, PDF) into a prefilled ReviewModel.
   */
  static async processDocument(file: SelectedFile): Promise<ReviewModel> {
    console.log(`[DocumentIngestionService] Ingesting document: source=${file.source}, name=${file.name}, mimeType=${file.mimeType}`);

    const isPdf = file.source === 'pdf' || file.mimeType === 'application/pdf';

    try {
      if (isPdf) {
        return await this.processPdf(file);
      } else {
        return await this.processImage(file);
      }
    } catch (err: any) {
      console.error(`[DocumentIngestionService] Ingestion failed: ${err?.message || err}`);
      throw err;
    }
  }

  /**
   * Pipeline for Image (Camera & Gallery)
   */
  private static async processImage(file: SelectedFile): Promise<ReviewModel> {
    console.log('[DocumentIngestionService] Image pipeline: Starting Cloudinary upload + backend Gemini extraction');

    // 1. Send image to backend for upload + Tesseract OCR + Gemini extraction
    const backendRes = await apiClient.uploadImageToBackend(file.uri);

    // 2. Perform on-device MLKit OCR fallback if raw text from backend is empty
    let extractedText = backendRes.extracted_text || backendRes.ocr_text || '';
    if (!extractedText.trim()) {
      try {
        console.log('[DocumentIngestionService] Backend OCR empty, running local MLKit OCR...');
        const mlkitResult = await runMLKitOCR(file.uri, {
          uri: file.uri,
          name: file.name,
          width: 0,
          height: 0,
          size: file.size,
          source: file.source === 'camera' ? 'camera' : 'gallery',
          mimeType: file.mimeType,
        });
        extractedText = mlkitResult.rawText;
      } catch (mlkitErr) {
        console.warn('[DocumentIngestionService] Local MLKit OCR fallback error:', mlkitErr);
      }
    }

    // 3. Map backend response into standard ReviewModel
    return this.mapBackendResponseToReviewModel(
      backendRes,
      file.uri,
      file.source,
      extractedText
    );
  }

  /**
   * Pipeline for PDF
   */
  private static async processPdf(file: SelectedFile): Promise<ReviewModel> {
    console.log('[DocumentIngestionService] PDF pipeline: Starting backend PDF text extraction + Gemini');

    // 1. Send PDF to backend upload-pdf endpoint
    const backendRes = await apiClient.uploadPdfToBackend(file.uri, file.name);

    // 2. Map backend response into standard ReviewModel
    return this.mapBackendResponseToReviewModel(
      backendRes,
      file.uri,
      'pdf',
      backendRes.extracted_text || backendRes.ocr_text || ''
    );
  }

  /**
   * Map standardized API response to ReviewModel
   */
  private static mapBackendResponseToReviewModel(
    res: any,
    imageUri: string,
    source: 'camera' | 'gallery' | 'pdf',
    fallbackText: string
  ): ReviewModel {
    const docType = res.document_type || 'unknown';
    const title = res.display_name || this.getDefaultTitle(docType);
    const category = this.mapCategory(res.category || docType);
    const extractedText = res.extracted_text || res.ocr_text || fallbackText || '';
    const structuredFields = res.structured_data || {};
    const confidence = typeof res.confidence === 'number' ? res.confidence : 0.9;
    const cloudinaryUrl = res.secure_url || undefined;
    const processingTime = res.processing_time || 0.0;
    const validation = res.validation || undefined;

    return {
      documentTitle: title,
      category,
      extractedText,
      structuredFields,
      imageUri,
      cloudinaryUrl,
      confidence,
      documentType: docType,
      source,
      processingTime,
      validation,
    };
  }

  private static getDefaultTitle(docType: string): string {
    switch (docType) {
      case 'aadhaar':
        return 'Aadhaar Card';
      case 'pan':
        return 'PAN Card';
      case 'passport':
        return 'Passport';
      case 'driving_license':
        return 'Driving Licence';
      default:
        return 'Unknown Document';
    }
  }

  private static mapCategory(catOrDocType: string): DocumentCategory {
    const str = catOrDocType.toLowerCase();
    if (str.includes('identity') || str.includes('aadhaar') || str.includes('pan') || str.includes('passport') || str.includes('driving')) {
      return 'Govt IDs';
    }
    if (str.includes('cert') || str.includes('income') || str.includes('caste')) {
      return 'Certificates';
    }
    if (str.includes('edu') || str.includes('degree') || str.includes('marksheet')) {
      return 'Education';
    }
    return 'Other';
  }
}
