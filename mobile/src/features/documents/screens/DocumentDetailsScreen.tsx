/**
 * DocumentDetailsScreen.tsx
 *
 * Full-featured document detail view.
 *
 * Features:
 *  • Fetch document by ID from the global store (already hydrated)
 *  • Display image with loading/error states
 *  • Detail card: title, category, source, date
 *  • Confidence badge (green / yellow / red)
 *  • Tags chips
 *  • Scrollable selectable OCR text
 *  • Action buttons: Edit (coming soon), Share (coming soon), Download, Delete
 *  • Delete with confirmation → back + store sync
 *  • Skeleton loader while store hydrates
 *  • Error state when document not found
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Paths, File } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library/legacy';

import { Colors, Spacing, Typography, Radius } from '@/theme';
import { apiClient, VaultGovDocument } from '@/services/api';
import { storageService } from '@/services/storageService';
import { useDocumentStore } from '../store/useDocumentStore';
import { useStatsStore } from '@/store/useStatsStore';

// ── Detail sub-components (barrel import) ─────────────────────────────────────
import {
  DocumentImage,
  DetailCard,
  ConfidenceBadge,
  TagChipRow,
  OCRTextSection,
  ActionButtons,
} from '../components/details';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentDetailsScreenProps {
  /** Document ID passed from the Expo Router dynamic route. */
  id: string;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const DocumentDetailsScreen: React.FC<DocumentDetailsScreenProps> = ({ id }) => {
  const router = useRouter();
  const { documents, isHydrating } = useDocumentStore();

  const [document, setDocument] = useState<VaultGovDocument | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ── Fetch document directly from API ───────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadDoc() {
      try {
        setIsLoadingDoc(true);
        // First try to find it in the store to avoid a loading flash if possible
        const storeDoc = documents.find((doc) => doc.id === id);
        if (storeDoc && isMounted) {
          setDocument(storeDoc);
        }
        
        // Always fetch fresh from backend
        const freshDoc = await apiClient.getDocument(id);
        if (isMounted) {
          setDocument(freshDoc);
        }
      } catch (err: any) {
        console.error('[DocumentDetails] Failed to fetch document:', err);
        // Handle 404 when document is stale in cache
        if (err?.message?.includes('404') || err?.response?.status === 404 || err?.status === 404 || err?.name === 'ApiError') {
          useDocumentStore.getState().removeDocument(id);
          useStatsStore.getState().fetchStats();
          Alert.alert('Not Found', 'This document no longer exists.');
          router.back();
        }
      } finally {
        if (isMounted) setIsLoadingDoc(false);
      }
    }
    
    if (id) {
      loadDoc();
    } else {
      setIsLoadingDoc(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [id, documents]);

  // ── Build detail rows (memoised, avoids re-render on unrelated state changes)
  const detailRows = useMemo(() => {
    if (!document) return [];
    return [
      { label: 'Title', value: document.title },
      { label: 'Category', value: document.category || 'Uncategorised' },
      { label: 'Source', value: document.source === 'camera' ? 'Camera scan' : 'Upload' },
      {
        label: 'Uploaded',
        value: new Date(document.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      },
    ];
  }, [document]);

  // ── Back navigation ─────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // ── Download to gallery ─────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!document?.image_uri || !document.image_uri.startsWith('http')) {
      Alert.alert('Download Error', 'No remote image is available for this document.');
      return;
    }

    try {
      setIsDownloading(true);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Allow access to your media library to save the image.'
        );
        return;
      }

      // Derive extension from Cloudinary URL before the query string
      const ext = document.image_uri.split('?')[0].split('.').pop() || 'jpg';
      let destination = new File(Paths.cache, `${document.id}.${ext}`);

      if (destination.exists) {
        destination = new File(Paths.cache, `${document.id}_${Date.now()}.${ext}`);
      }

      const downloadedFile = await File.downloadFileAsync(document.image_uri, destination);
      await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);

      Alert.alert('Saved', 'The image has been saved to your gallery.');
    } catch (err) {
      console.error('[DocumentDetails] Download error:', err);
      Alert.alert('Download Failed', 'Could not save the image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [document]);

  // ── Delete with confirmation ─────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!document) return;

    Alert.alert(
      'Delete this document?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);

              // 1. Remove the Cloudinary image if one exists
              if (document.image_uri) {
                await storageService.deleteDocumentImage(document.image_uri);
              }

              // 2. Delete the backend record
              await apiClient.deleteDocument(document.id);

              // 3. Remove from the global store so list screens update immediately
              useDocumentStore.getState().removeDocument(document.id);

              // 4. Update the dashboard stats
              await useStatsStore.getState().fetchStats();

              // 5. Navigate back — the list will have already updated
              router.back();
            } catch (err) {
              console.error('[DocumentDetails] Delete error:', err);
              Alert.alert('Delete Failed', 'An error occurred. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [document, router]);

  // ── Loading state (fetching document or store hydrating) ────────────────────
  if (isHydrating || isLoadingDoc) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading document…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state (document not found) ────────────────────────────────────────
  if (!document) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Ionicons name="document-text-outline" size={52} color={Colors.darkGray} />
          <Text style={styles.notFoundTitle}>Document not found</Text>
          <Text style={styles.notFoundSub}>
            This document may have been deleted or could not be loaded.
          </Text>
          <Pressable
            style={styles.retryBtn}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.retryBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const canDownload =
    typeof document.image_uri === 'string' && document.image_uri.startsWith('http');

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primaryBlue} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Document Details
        </Text>

        {/* Overflow menu placeholder — keeps layout symmetric */}
        <Pressable
          style={styles.menuBtn}
          accessibilityLabel="More options"
          accessibilityRole="button"
          onPress={() =>
            Alert.alert('Coming Soon', 'Document options will be available in a future update.')
          }
        >
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.darkGray} />
        </Pressable>
      </View>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image */}
        <DocumentImage imageUri={document.image_uri} />

        {/* Section: Details */}
        <SectionLabel text="DETAILS" />
        <View style={styles.sectionBody}>
          <DetailCard rows={detailRows} />
        </View>

        {/* Section: Confidence */}
        <SectionLabel text="CONFIDENCE SCORE" />
        <View style={[styles.sectionBody, styles.confidenceRow]}>
          <ConfidenceBadge score={document.confidence_score} />
          <Text style={styles.confidenceHint}>
            {document.confidence_score !== null
              ? 'OCR accuracy based on image clarity'
              : 'Score unavailable for this document'}
          </Text>
        </View>

        {/* Section: Tags */}
        <SectionLabel text="TAGS" />
        <View style={styles.sectionBody}>
          <TagChipRow tags={document.tags} />
        </View>

        {/* Section: OCR Text */}
        <OCRTextSection text={document.extracted_text} />
      </ScrollView>

      {/* ── Bottom action bar ────────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <ActionButtons
          onDelete={handleDelete}
          onDownload={handleDownload}
          isDeleting={isDeleting}
          isDownloading={isDownloading}
          canDownload={canDownload}
        />
      </View>
    </SafeAreaView>
  );
};

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Small uppercase section label (e.g. "DETAILS", "TAGS"). */
const SectionLabel: React.FC<{ text: string }> = ({ text }) => (
  <Text style={styles.sectionLabel}>{text}</Text>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 64,
  },
  backText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
    marginLeft: 4,
    fontFamily: Typography.fontFamilies.sans,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  menuBtn: {
    minWidth: 32,
    alignItems: 'flex-end',
    paddingLeft: Spacing.sm,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 180, // clear fixed bottom bar
  },

  // ── Section ───────────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#888888',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
  },
  sectionBody: {
    marginBottom: Spacing.lg,
  },

  // ── Confidence row ────────────────────────────────────────────────────────
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  confidenceHint: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    lineHeight: 18,
  },

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottomBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
    paddingVertical: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: { elevation: 8 },
    }),
  },

  // ── Loading / Error ───────────────────────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginTop: Spacing.sm,
  },
  notFoundTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  notFoundSub: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    backgroundColor: Colors.primaryBlue,
    borderRadius: Radius.button,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.md,
  },
});
