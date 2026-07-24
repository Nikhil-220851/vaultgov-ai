/**
 * DocumentReviewScreen.tsx
 *
 * The SINGLE Unified Review Screen for all document sources (Camera, Gallery, PDF).
 *
 * Responsibilities:
 *  - Receive a prefilled ReviewModel
 *  - Display document metadata & preview
 *  - Render structured fields dynamically (Object.entries)
 *  - Allow editing of Title, Category, and Dynamic Structured Fields
 *  - Direct DB Save via POST /documents (<1s target, NO Gemini call)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as crypto from 'expo-crypto';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import {
  ReviewModel,
  DocumentCategory,
  ValidationResult,
  FieldValidationResult,
} from '../types/review.types';
import { useDocumentStore } from '@/features/documents/store/useDocumentStore';
import { apiClient } from '@/services/api';
import { auth } from '@/services/firebase';

const CATEGORIES: { label: DocumentCategory; icon: string }[] = [
  { label: 'Govt IDs', icon: 'card-outline' },
  { label: 'Certificates', icon: 'document-text-outline' },
  { label: 'Education', icon: 'school-outline' },
  { label: 'Other', icon: 'folder-outline' },
];

interface DocumentReviewScreenProps {
  reviewModel: ReviewModel;
  onBack: () => void;
}

const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon as any} size={16} color={Colors.darkGray} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

export const DocumentReviewScreen: React.FC<DocumentReviewScreenProps> = ({
  reviewModel,
  onBack,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchDocuments } = useDocumentStore();

  const [title, setTitle] = useState(reviewModel.documentTitle || 'Scanned Document');
  const [category, setCategory] = useState<DocumentCategory>(reviewModel.category);
  const [tagsInput, setTagsInput] = useState(reviewModel.documentType || '');
  const [fields, setFields] = useState<Record<string, string | null>>(
    reviewModel.structuredFields || {}
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const isSavingRef = useRef(false);
  const [saveButtonScale] = useState(() => new Animated.Value(1));

  // ── Validation State ──────────────────────────────────────────────────
  const [validation, setValidation] = useState<ValidationResult | undefined>(
    reviewModel.validation
  );
  const [isValidating, setIsValidating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requiredFieldsFromValidation = validation
    ? Object.entries(validation.field_results)
        .filter(([, r]) => r.status === 'Invalid' && !!(reviewModel.structuredFields ?? {}))
        .map(([k]) => k)
    : [];

  const runValidation = useCallback(
    async (currentFields: Record<string, string | null>) => {
      if (!reviewModel.documentType || reviewModel.documentType === 'unknown') return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          setIsValidating(true);
          const result = await apiClient.post('/documents/validate', {
            document_type: reviewModel.documentType,
            fields: currentFields,
          });
          setValidation(result as ValidationResult);
        } catch (e) {
          // Validation errors are non-critical; swallow silently
        } finally {
          setIsValidating(false);
        }
      }, 600);
    },
    [reviewModel.documentType]
  );

  const handleFieldChange = (key: string, val: string) => {
    const updated = { ...fields, [key]: val };
    setFields(updated);
    runValidation(updated);
  };


  const CategoryChip: React.FC<{ item: (typeof CATEGORIES)[number] }> = ({ item }) => {
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

  // ── SAVE FLOW: DB Save ONLY (<1 second) ──────────────────────────────
  const handleSave = useCallback(async () => {
    if (isSavingRef.current) {
      console.log('[DocumentReviewScreen] Save already in progress. Ignoring duplicate tap.');
      return;
    }

    const requestId = crypto.randomUUID();
    console.log(`[SAVE FLOW] [${requestId}] Save pressed`);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Missing title', 'Please enter a document title before saving.');
      return;
    }

    // ── Validation Gate (Phase 4.1) ───────────────────────────────────────────
    if (validation) {
      const requiredFields = new Set(validation.required_fields ?? []);

      // Required fields that are Invalid → hard block
      const invalidRequiredKeys = Object.entries(validation.field_results)
        .filter(([key, result]) => result.status === 'Invalid' && requiredFields.has(key))
        .map(([key]) => key);

      if (invalidRequiredKeys.length > 0) {
        Alert.alert(
          'Cannot Save',
          'Please correct all required fields before saving.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Optional fields that are Invalid → soft warning (user may proceed)
      const invalidOptionalKeys = Object.entries(validation.field_results)
        .filter(([key, result]) => result.status === 'Invalid' && !requiredFields.has(key))
        .map(([key]) => key);

      if (invalidOptionalKeys.length > 0) {
        const shouldContinue = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Validation Warnings',
            'This document contains some optional fields that appear to be invalid. You can still save it and edit it later.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Save Anyway', onPress: () => resolve(true) },
            ]
          );
        });
        if (!shouldContinue) return;
      }
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveStatus('Saving to Vault...');

    Animated.sequence([
      Animated.timing(saveButtonScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(saveButtonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    let success = false;
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated.');
      }

      // If we don't have a Cloudinary URL yet (e.g. PDF local file or fallback), upload now
      let finalImageUrl = reviewModel.cloudinaryUrl || null;
      if (!finalImageUrl && reviewModel.source !== 'pdf') {
        setSaveStatus('Uploading image...');
        const res = await apiClient.uploadImageToBackend(reviewModel.imageUri, requestId);
        finalImageUrl = res.secure_url;
      }

      setSaveStatus('Saving document...');

      // Build structured text combining dynamic fields
      const structuredTextSummary = Object.entries(fields)
        .map(([k, v]) => `${k}: ${v || 'N/A'}`)
        .join('\n');

      const fullExtractedText = [
        reviewModel.extractedText,
        '--- STRUCTURED FIELDS ---',
        structuredTextSummary,
      ].join('\n\n');

      // Call database POST /documents directly (<1s target, NO Gemini call)
      await apiClient.createDocument({
        title: trimmedTitle,
        category,
        image_uri: finalImageUrl || reviewModel.imageUri,
        source: reviewModel.source === 'camera' ? 'camera' : 'upload',
        extracted_text: fullExtractedText,
        tags,
        confidence_score: reviewModel.confidence || 0.9,
        supports_expiry: validation?.supports_expiry ?? false,
      });

      setSaveStatus('Done.');
      await fetchDocuments();
      console.log(`[SAVE FLOW] [${requestId}] Document saved successfully`);

      success = true;
      router.replace('/(tabs)/docs' as any);
    } catch (err: any) {
      console.error('[DocumentReviewScreen] Save error:', err);
      Alert.alert('Save failed', err?.message || 'Document save failed. Please try again.');
    } finally {
      if (!success) {
        setIsSaving(false);
        isSavingRef.current = false;
        setSaveStatus('');
      }
    }
  }, [title, category, tagsInput, fields, reviewModel, fetchDocuments, router, saveButtonScale]);

  const isPdf = reviewModel.source === 'pdf';
  const entries = Object.entries(fields);

  const confidencePct = Math.round((reviewModel.confidence || 0) * 100);
  const confidenceColor =
    confidencePct >= 80 ? '#16A34A' : confidencePct >= 50 ? '#CA8A04' : '#DC2626';

  const validationScore = validation?.score ?? null;
  const validationColor =
    validationScore === null
      ? Colors.darkGray
      : validationScore >= 80
      ? '#16A34A'
      : validationScore >= 50
      ? '#CA8A04'
      : '#DC2626';

  /** Render per-field validation indicator below each TextInput */
  const renderFieldValidation = (key: string) => {
    const fieldResult: FieldValidationResult | undefined = validation?.field_results?.[key];
    if (!fieldResult || fieldResult.status === 'Valid') return null;

    const isInvalid = fieldResult.status === 'Invalid';
    const color = isInvalid ? '#DC2626' : '#CA8A04';
    const icon = isInvalid ? 'close-circle-outline' : 'warning-outline';
    const prefix = isInvalid ? '✗' : '⚠';

    return (
      <View style={styles.fieldValidationRow}>
        <Ionicons name={icon as any} size={12} color={color} />
        <Text style={[styles.fieldValidationText, { color }]}>
          {prefix} {fieldResult.reason || (isInvalid ? 'Invalid value' : 'Check this field')}
        </Text>
      </View>
    );
  };

  /** Render a green ✓ for valid fields */
  const renderFieldValidIcon = (key: string) => {
    const fieldResult: FieldValidationResult | undefined = validation?.field_results?.[key];
    if (!fieldResult || fieldResult.status !== 'Valid') return null;
    return (
      <View style={styles.fieldValidationRow}>
        <Ionicons name="checkmark-circle-outline" size={12} color="#16A34A" />
        <Text style={[styles.fieldValidationText, { color: '#16A34A' }]}>✓ Valid</Text>
      </View>
    );
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={onBack}
          accessibilityLabel="Go back"
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
        {/* Document Asset Preview */}
        <View style={styles.previewCard}>
          {isPdf ? (
            <View style={styles.pdfPreview}>
              <Ionicons name="document-text-outline" size={40} color={Colors.primaryBlue} />
              <Text style={styles.pdfTitle} numberOfLines={1}>
                {title}.pdf
              </Text>
              <Text style={styles.pdfSubtitle}>PDF Document</Text>
            </View>
          ) : (
            <Image
              source={{ uri: reviewModel.imageUri }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          )}
        </View>

        {/* AI Intelligence Summary Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="sparkles-outline" size={13} color={Colors.primaryBlue} />
            <Text style={styles.badgeText}>{reviewModel.documentType || 'unknown'}</Text>
          </View>
          <View style={[styles.badge, { borderColor: confidenceColor }]}>
            <Ionicons name="checkmark-circle-outline" size={13} color={confidenceColor} />
            <Text style={[styles.badgeText, { color: confidenceColor }]}>
              {confidencePct}% confidence
            </Text>
          </View>
          {reviewModel.processingTime ? (
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={13} color={Colors.darkGray} />
              <Text style={styles.badgeText}>{reviewModel.processingTime.toFixed(1)}s</Text>
            </View>
          ) : null}
          {validationScore !== null && (
            <View style={[styles.badge, { borderColor: validationColor }]}>
              {isValidating ? (
                <ActivityIndicator size="small" color={validationColor} />
              ) : (
                <Ionicons name="shield-checkmark-outline" size={13} color={validationColor} />
              )}
              <Text style={[styles.badgeText, { color: validationColor }]}>
                {isValidating ? 'Validating…' : `${Math.round(validationScore)}% valid`}
              </Text>
            </View>
          )}
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <SectionHeader title="Document Title" icon="text-outline" />
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Document Title"
            placeholderTextColor="#AAAAAA"
            maxLength={120}
            selectionColor={Colors.primaryBlue}
            returnKeyType="done"
            editable={!isSaving}
          />
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <SectionHeader title="Category" icon="layers-outline" />
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((item) => (
              <CategoryChip key={item.label} item={item} />
            ))}
          </View>
        </View>

        {/* DYNAMIC FIELDS: Rendered automatically via Object.entries */}
        {entries.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Extracted Information" icon="sparkles-outline" />
            {entries.map(([key, val]) => {
              const fieldResult = validation?.field_results?.[key];
              const isInvalid = fieldResult?.status === 'Invalid';
              const isWarning = fieldResult?.status === 'Warning';
              const inputBorderColor = isInvalid
                ? '#DC2626'
                : isWarning
                ? '#CA8A04'
                : '#E5E5EA';

              return (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{key.replace(/_/g, ' ')}</Text>
                  <TextInput
                    style={[styles.fieldInput, { borderColor: inputBorderColor }]}
                    value={val || ''}
                    onChangeText={(newVal) => handleFieldChange(key, newVal)}
                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                    placeholderTextColor="#AAAAAA"
                    editable={!isSaving}
                  />
                  {renderFieldValidation(key)}
                  {renderFieldValidIcon(key)}
                </View>
              );
            })}
          </View>
        )}

        {/* Extracted Raw OCR Text Preview */}
        <View style={styles.section}>
          <SectionHeader title="Raw Extracted Text" icon="eye-outline" />
          <View style={styles.textPreviewCard}>
            <Text style={styles.textPreview} numberOfLines={8}>
              {reviewModel.extractedText || 'No raw text extracted.'}
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
                <Text style={styles.saveButtonText}>{saveStatus || 'Saving...'}</Text>
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
  previewCard: {
    height: 180,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  pdfPreview: {
    alignItems: 'center',
    gap: 6,
  },
  pdfTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
  },
  pdfSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
    textTransform: 'capitalize',
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
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
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
  fieldRow: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
    textTransform: 'capitalize',
  },
  fieldInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: Typography.sizes.sm,
    color: Colors.pureBlack,
  },
  fieldValidationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingLeft: 2,
  },
  fieldValidationText: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
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
