/**
 * document-preview.tsx  (route: /document-preview)
 *
 * Unified Ingestion Route:
 * Loads DocumentIngestionService -> displays loading indicator ("Analyzing document...")
 * -> transitions directly to DocumentReviewScreen.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/theme';
import { SelectedFile } from '@/features/documents/upload.service';
import { DocumentIngestionService } from '@/features/documents/services/DocumentIngestionService';
import { ReviewModel } from '@/features/documents/types/review.types';
import { DocumentReviewScreen } from '@/features/scanner/screens/DocumentReviewScreen';

export default function DocumentPreviewRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const uri = typeof params.uri === 'string' ? params.uri : '';
  const name = typeof params.name === 'string' ? params.name : 'document';
  const mimeType = typeof params.mimeType === 'string' ? params.mimeType : 'image/jpeg';
  const source = (typeof params.source === 'string' ? params.source : 'gallery') as SelectedFile['source'];
  const size = params.size ? Number(params.size) : undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reviewModel, setReviewModel] = useState<ReviewModel | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const runIngestion = useCallback(() => {
    if (!uri) {
      setErrorMsg('No file URI provided.');
      setIsLoading(false);
      return;
    }

    const file: SelectedFile = { uri, name, mimeType, source, size };

    setIsLoading(true);
    setErrorMsg(null);
    setReviewModel(null);

    let isMounted = true;

    DocumentIngestionService.processDocument(file)
      .then((model) => {
        if (isMounted) {
          setReviewModel(model);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err?.message || 'Failed to analyze document.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [uri, name, mimeType, source, size]);

  // Re-run when uri changes or retry is triggered
  useEffect(() => {
    return runIngestion();
  }, [uri, name, mimeType, source, size, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryBlue} />
        <Text style={styles.loadingTitle}>Analyzing document...</Text>
        <Text style={styles.loadingSubtitle}>
          Performing OCR and extracting document intelligence
        </Text>
      </View>
    );
  }

  if (errorMsg || !reviewModel) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.dangerRed} />
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorText}>{errorMsg || 'Could not process document.'}</Text>

        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.85 }]}
          onPress={() => setRetryCount((c) => c + 1)}
          accessibilityLabel="Retry document analysis"
          accessibilityRole="button"
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.white} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backLinkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <DocumentReviewScreen
      reviewModel={reviewModel}
      onBack={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  loadingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.pureBlack,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  retryButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  backLink: {
    padding: 8,
  },
  backLinkText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
});
