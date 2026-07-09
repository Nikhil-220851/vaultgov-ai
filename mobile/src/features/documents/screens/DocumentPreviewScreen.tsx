/**
 * DocumentPreviewScreen.tsx
 *
 * Screen rendering the SelectedFile, OCR status banner, extracted fields
 * with edit logic, and the bottom actions: Retake and Save.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { SelectedFile } from '../upload.service';
import { useDocumentIngestion } from '../hooks/useDocumentIngestion';
import { OCRStatusBanner } from '../components/OCRStatusBanner';
import { ExtractedFieldRow } from '../components/ExtractedFieldRow';

interface DocumentPreviewScreenProps {
  file: SelectedFile;
  onFileChanged: (newFile: SelectedFile) => void;
}

export const DocumentPreviewScreen: React.FC<DocumentPreviewScreenProps> = ({
  file,
  onFileChanged,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    ocrStatus,
    fields,
    updateField,
    retake,
    saveDocument,
    isSaving,
    canSave,
  } = useDocumentIngestion(file, onFileChanged);

  const handleBack = () => {
    router.back();
  };

  const isPdf = file.source === 'pdf' || file.mimeType === 'application/pdf';

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.sm) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primaryBlue} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Document preview</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Asset Preview Area */}
        <View style={styles.previewContainer}>
          {isPdf ? (
            <View style={styles.pdfPlaceholder}>
              <Ionicons name="document-text-outline" size={48} color={Colors.darkGray} />
              <Text style={styles.pdfName} numberOfLines={2} ellipsizeMode="middle">
                {file.name}
              </Text>
              <Text style={styles.pdfMeta}>
                PDF Document • {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Size unknown'}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: file.uri }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          )}
        </View>

        {/* OCR Status Banner */}
        <OCRStatusBanner status={ocrStatus} />

        {/* Extracted Fields Section */}
        {ocrStatus !== 'failed' && fields.length > 0 && (
          <View style={styles.fieldsSection}>
            <Text style={styles.fieldsTitle}>EXTRACTED FIELDS</Text>
            <View style={styles.fieldsList}>
              {fields.map((field) => (
                <ExtractedFieldRow
                  key={field.key}
                  field={field}
                  onSaveValue={(newValue) => updateField(field.key, newValue)}
                />
              ))}
            </View>
          </View>
        )}

        {ocrStatus === 'failed' && (
          <View style={styles.failedContainer}>
            <Ionicons name="alert-circle-outline" size={36} color={Colors.dangerRed} />
            <Text style={styles.failedTitle}>Details not found</Text>
            <Text style={styles.failedText}>
              {"We couldn't extract details from this document. Please try again with a clearer picture or file."}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Pressable
          onPress={retake}
          style={[styles.btnSecondary, isSaving && styles.btnDisabled]}
          disabled={isSaving}
          accessibilityLabel="Retake document capture"
          accessibilityRole="button"
        >
          <Text style={styles.btnSecondaryText}>Retake</Text>
        </Pressable>

        <Pressable
          onPress={saveDocument}
          style={[
            styles.btnPrimary,
            (!canSave || ocrStatus === 'failed' || isSaving) && styles.btnDisabled,
          ]}
          disabled={!canSave || ocrStatus === 'failed' || isSaving}
          accessibilityLabel="Save document to vault"
          accessibilityRole="button"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color={Colors.white} style={styles.btnIcon} />
              <Text style={styles.btnPrimaryText}>Save document</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
  },
  headerRightPlaceholder: {
    width: 60, // approximate balance to back button
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100, // offset for sticky bottom actions
  },
  previewContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F5F5F3',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C0C0C0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  pdfPlaceholder: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  pdfName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.pureBlack,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  pdfMeta: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.darkGray,
    marginTop: 4,
  },
  fieldsSection: {
    marginTop: Spacing.sm,
  },
  fieldsTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: '#666666',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  fieldsList: {
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
  },
  failedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  failedTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  failedText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...(Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }) as ViewStyle),
  },
  btnSecondary: {
    flex: 1,
    height: 48,
    borderRadius: Radius.button,
    backgroundColor: '#F5F5F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  btnSecondaryText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#333333',
  },
  btnPrimary: {
    flex: 2,
    flexDirection: 'row',
    height: 48,
    borderRadius: Radius.button,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  btnIcon: {
    marginRight: 6,
  },
  btnDisabled: {
    opacity: 0.5,
    backgroundColor: '#D0D0D0',
    borderColor: '#D0D0D0',
  },
});

export default DocumentPreviewScreen;
