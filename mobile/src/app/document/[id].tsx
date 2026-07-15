import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DocumentDetailsScreen } from '@/features/documents/screens/DocumentDetailsScreen';

export default function DocumentRoute() {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';

  return <DocumentDetailsScreen id={id} />;
}
