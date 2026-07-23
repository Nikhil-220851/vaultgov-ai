/**
 * ocr-processing.tsx  (route: /scan/ocr-processing)
 *
 * Redirects legacy /scan/ocr-processing route to the unified /document-preview route.
 */

import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function OCRProcessingRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    router.replace({
      pathname: '/document-preview' as any,
      params,
    });
  }, [router, params]);

  return null;
}
