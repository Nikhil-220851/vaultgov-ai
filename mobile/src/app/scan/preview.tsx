import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PreviewScreen } from '@/features/scanner/screens/PreviewScreen';
import { ScannedDocument } from '@/features/scanner/types/scanner.types';

export default function PreviewRoute() {
  const params = useLocalSearchParams();

  const uri = typeof params.uri === 'string' ? params.uri : '';
  const name = typeof params.name === 'string' ? params.name : 'document.jpg';
  const mimeType = typeof params.mimeType === 'string' ? params.mimeType : 'image/jpeg';
  const width = params.width ? Number(params.width) : 0;
  const height = params.height ? Number(params.height) : 0;
  const size = params.size ? Number(params.size) : undefined;
  const source = (typeof params.source === 'string' ? params.source : 'camera') as 'camera' | 'gallery';

  if (!uri) {
    return null; // Safe guard
  }

  const initialFile: ScannedDocument = {
    uri,
    name,
    mimeType,
    width,
    height,
    size,
    source,
  };

  return <PreviewScreen initialFile={initialFile} />;
}
