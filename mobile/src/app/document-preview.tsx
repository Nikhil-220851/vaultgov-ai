/**
 * document-preview.tsx
 *
 * Thin Expo Router screen wrapper for the Document Preview feature.
 * Reads file metadata from the query params, initializes local state,
 * and renders the DocumentPreviewScreen.
 */

import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SelectedFile } from '@/features/documents/upload.service';
import { DocumentPreviewScreen } from '@/features/documents/screens/DocumentPreviewScreen';

export default function DocumentPreviewRoute() {
  const params = useLocalSearchParams();

  // Retrieve parameters safely
  const uri = typeof params.uri === 'string' ? params.uri : '';
  const name = typeof params.name === 'string' ? params.name : 'document';
  const mimeType = typeof params.mimeType === 'string' ? params.mimeType : 'image/jpeg';
  const source = (typeof params.source === 'string' ? params.source : 'gallery') as SelectedFile['source'];
  const size = params.size ? Number(params.size) : undefined;

  // Initialize state with the file details passed in the route url
  const [currentFile, setCurrentFile] = useState<SelectedFile | null>(() => {
    if (!uri) return null;
    return {
      uri,
      name,
      mimeType,
      source,
      size,
    };
  });

  if (!currentFile) {
    return null; // Safety fallthrough if no file metadata was passed
  }

  return (
    <DocumentPreviewScreen
      file={currentFile}
      onFileChanged={setCurrentFile}
    />
  );
}
