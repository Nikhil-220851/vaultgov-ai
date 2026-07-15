/**
 * DocumentReviewScreen.tsx
 *
 * Document Review screen — the final step before saving.
 * The user can:
 *  - Review and edit the document title
 *  - Select a category (Govt IDs, Certificates, Education, Other)
 *  - Add optional comma-separated tags
 *  - See a summary of the extracted text and metadata
 *  - Tap Save to persist the document to the vault
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { DocumentReviewData, DocumentReviewCategory, OCRConfidenceLevel } from '../types/ocr.types';
import { useDocumentStore } from '@/features/documents/store/useDocumentStore';
import { apiClient } from '@/services/api';
import { storageService } from '@/services/storageService';
import { auth } from '@/services/firebase';

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES: { label: DocumentReviewCategory; icon: string }[] = [
  { label: 'Govt IDs',      icon: 'card-outline' },
  { label: 'Certificates',  icon: 'document-text-outline' },
  { label: 'Education',     icon: 'school-outline' },
  { label: 'Other',         icon: 'folder-outline' },
];

// ─── Confidence coloring ───────────────────────────────────────────────────────

const CONFIDENCE_COLORS: Record<OCRConfidenceLevel, string> = {
  Excellent: '#1A9130',
  Good:      '#1565C0',
  Fair:      '#B36800',
  Poor:      '#C62828',
  Unknown:   '#707070',
};




// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentReviewScreenProps {
  reviewData: DocumentReviewData;
  onBack: () => void;
}

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon as any} size={16} color={Colors.darkGray} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const DocumentReviewScreen: React.FC<DocumentReviewScreenProps> = ({
  reviewData,
  onBack,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchDocuments } = useDocumentStore();

  const [title, setTitle] = useState(reviewData.metadata.detectedTitle || reviewData.title || 'Scanned Document');
  const [category, setCategory] = useState<DocumentReviewCategory>(reviewData.category);
  const [tagsInput, setTagsInput] = useState(reviewData.tags.join(', '));
  const [isSaving, setIsSaving] = useState(false);

  const [saveStatus, setSaveStatus] = useState('');
  const isSavingRef = React.useRef(false);

  const [saveButtonScale] = useState(() => new Animated.Value(1));

  // ── Category selector ────────────────────────────────────────────────────────

  const CategoryChip: React.FC<{ item: typeof CATEGORIES[number] }> = ({ item }) => {
    const isSelected = category === item.label;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.categoryChip,
          isSelected && styles.categoryChipSelected,
          pressed && { opacity: 0.8 },
          isSaving && { opacity: 0.5 },
        ]}
        onPress={() => {
          if (!isSaving) setCategory(item.label);
        }}
        accessibilityLabel={`Select category ${item.label}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        disabled={isSaving}
      >
        <Ionicons
          name={item.icon as any}
          size={16}
          color={isSelected ? Colors.white : Colors.darkGray}
        />
        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  // ── Save handler ─────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (isSavingRef.current) {
      console.log('[DocumentReview] Save already in progress. Ignoring duplicate tap.');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Missing title', 'Please enter a document title before saving.');
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveStatus('Uploading image...');

    Animated.sequence([
      Animated.timing(saveButtonScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(saveButtonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated.');
      }

      // Upload image to Cloudinary
      console.log('[DocumentReview] Uploading image to Cloudinary...');
      const downloadUrl = await storageService.uploadDocumentImage(reviewData.imageUri);

      setSaveStatus('Saving document...');
      await apiClient.createDocument({
        title: trimmedTitle,
        category,
        image_uri: downloadUrl,
        source: reviewData.metadata.source === 'camera' ? 'camera' : 'upload',
        extracted_text: reviewData.extractedText,
        tags,
        confidence_score: reviewData.confidence.score ?? 0,
      });

      setSaveStatus('Done.');
      await fetchDocuments();
      console.log('[OCR] Document saved:', trimmedTitle);

      router.replace('/(tabs)/docs' as any);
    } catch (err: any) {
      console.error('[DocumentReview] Save error:', err);
      if (err.message && err.message.includes('Network request failed')) {
        Alert.alert('Upload failed', 'No internet connection. Please check your network and try again.');
      } else if (err.message && err.message.includes('upload')) {
        Alert.alert('Upload failed', 'Image upload failed. Please try again.');
      } else {
        Alert.alert('Save failed', 'Document upload failed. Please try again.');
      }
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
      setSaveStatus('');
    }
  }, [title, category, tagsInput, reviewData, fetchDocuments, router, saveButtonScale]);

  const displayConfidenceColor = CONFIDENCE_COLORS[reviewData.confidence.level];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={onBack}
          accessibilityLabel="Go back to extracted text"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={Colors.pureBlack} />
        </Pressable>
        <Text style={styles.headerTitle}>Review Document</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* OCR Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardRow}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primaryBlue} />
            <Text style={styles.summaryCardTitle}>OCR Summary</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryGridItem}>
              <Text style={styles.summaryGridLabel}>Words</Text>
              <Text style={styles.summaryGridValue}>{reviewData.metadata.wordCount}</Text>
            </View>
            <View style={styles.summaryGridItem}>
              <Text style={styles.summaryGridLabel}>Characters</Text>
              <Text style={styles.summaryGridValue}>{reviewData.metadata.characterCount}</Text>
            </View>
            <View style={styles.summaryGridItem}>
              <Text style={styles.summaryGridLabel}>Source</Text>
              <Text style={styles.summaryGridValue}>
                {reviewData.metadata.source === 'camera' ? 'Camera' : 'Gallery'}
              </Text>
            </View>
            <View style={styles.summaryGridItem}>
              <Text style={styles.summaryGridLabel}>Confidence</Text>
              <Text style={[styles.summaryGridValue, { color: displayConfidenceColor }]}>
                {reviewData.confidence.level}
              </Text>
            </View>
          </View>
        </View>

        {/* Document Title */}
        <View style={styles.section}>
          <SectionHeader title="Document Title" icon="text-outline" />
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Driving Licence, PAN Card…"
            placeholderTextColor="#AAAAAA"
            maxLength={120}
            selectionColor={Colors.primaryBlue}
            returnKeyType="done"
            accessibilityLabel="Document title"
            editable={!isSaving}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <SectionHeader title="Category" icon="layers-outline" />
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(item => (
              <CategoryChip key={item.label} item={item} />
            ))}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <SectionHeader title="Tags (optional)" icon="pricetag-outline" />
          <TextInput
            style={[styles.tagsInput, isSaving && { opacity: 0.5 }]}
            value={tagsInput}
            onChangeText={setTagsInput}
            placeholder="aadhaar, 2024, identity…"
            placeholderTextColor="#AAAAAA"
            selectionColor={Colors.primaryBlue}
            returnKeyType="done"
            accessibilityLabel="Document tags"
            editable={!isSaving}
          />
          <Text style={styles.tagsHint}>Separate tags with commas</Text>
        </View>

        {/* Extracted text preview */}
        <View style={styles.section}>
          <SectionHeader title="Extracted Text Preview" icon="eye-outline" />
          <View style={styles.textPreviewCard}>
            <Text style={styles.textPreview} numberOfLines={8}>
              {reviewData.editedLines.join('\n') || 'No text extracted.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Save Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Animated.View style={{ transform: [{ scale: saveButtonScale }], flex: 1 }}>
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.9 }]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityLabel="Save document to vault"
            accessibilityRole="button"
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.saveButtonText}>{saveStatus || 'Uploading...'}</Text>
              </>
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Save to Vault</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
  },
  headerPlaceholder: {
    width: 30,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
  },
  summaryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryCardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryGridItem: {
    width: '45%',
    gap: 2,
  },
  summaryGridLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  summaryGridValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: Typography.sizes.md,
    color: Colors.pureBlack,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  categoryChipSelected: {
    backgroundColor: Colors.pureBlack,
    borderColor: Colors.pureBlack,
  },
  categoryChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
  },
  categoryChipTextSelected: {
    color: Colors.white,
  },
  tagsInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: Typography.sizes.sm,
    color: Colors.pureBlack,
  },
  tagsHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginTop: -4,
  },
  textPreviewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 12,
  },
  textPreview: {
    fontSize: Typography.sizes.xs,
    color: '#444444',
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: Radius.button,
    backgroundColor: Colors.pureBlack,
  },
  saveButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
});
