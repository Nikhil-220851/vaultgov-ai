import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Paths, File } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { useDocumentStore } from '../store/useDocumentStore';
import { apiClient } from '@/services/api';
import { storageService } from '@/services/storageService';

interface DocumentDetailsScreenProps {
  id: string;
}

export const DocumentDetailsScreen: React.FC<DocumentDetailsScreenProps> = ({ id }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { documents, deleteDocument } = useDocumentStore();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const document = documents.find((doc) => doc.id === id);

  if (!document) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Document not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleDownload = async () => {
    if (!document.image_uri || !document.image_uri.startsWith('http')) {
      Alert.alert('Download Error', 'This document does not have a valid remote image to download.');
      return;
    }

    try {
      setIsDownloading(true);
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need media library permissions to save the image.');
        setIsDownloading(false);
        return;
      }

      const fileExtension = document.image_uri.split('?')[0].split('.').pop() || 'jpg';
      const destination = new File(Paths.cache, `${document.id}.${fileExtension}`);
      
      const downloadedFile = await File.downloadFileAsync(document.image_uri, destination);
      
      await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
      
      Alert.alert('Success', 'Image saved to your gallery successfully.');
    } catch (error) {
      console.error('[DocumentDetails] Download error:', error);
      Alert.alert('Download Error', 'An error occurred while downloading the image.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              
              if (document.image_uri) {
                await storageService.deleteDocumentImage(document.image_uri);
              }
              
              await apiClient.deleteDocument(document.id);
              deleteDocument(document.id);
              
              router.back();
            } catch (error) {
              console.error('[DocumentDetails] Delete error:', error);
              Alert.alert('Delete Error', 'An error occurred while deleting the document.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.sm) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.headerBackButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primaryBlue} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {document.title}
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Asset Area */}
        <View style={styles.previewContainer}>
          {document.image_uri ? (
            <Image
              source={{ uri: document.image_uri }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.pdfPlaceholder}>
              <Ionicons name="document-text-outline" size={48} color={Colors.darkGray} />
              <Text style={styles.pdfMeta}>No Image Available</Text>
            </View>
          )}
        </View>

        {/* Metadata Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETAILS</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Title</Text>
            <Text style={styles.detailValue}>{document.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{document.category || 'Uncategorised'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Source</Text>
            <Text style={styles.detailValue}>{document.source === 'camera' ? 'Camera' : 'Upload'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{new Date(document.created_at).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Extracted Text Section */}
        {document.extracted_text && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXTRACTED TEXT</Text>
            <View style={styles.textPreviewCard}>
              <Text style={styles.textPreview}>
                {document.extracted_text}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Pressable
          onPress={handleDelete}
          style={[styles.btnSecondary, isDeleting && styles.btnDisabled]}
          disabled={isDeleting || isDownloading}
          accessibilityLabel="Delete document"
          accessibilityRole="button"
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#D32F2F" />
          ) : (
            <Text style={styles.btnDangerText}>Delete</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleDownload}
          style={[
            styles.btnPrimary,
            (!document.image_uri || !document.image_uri.startsWith('http') || isDownloading || isDeleting) && styles.btnDisabled,
          ]}
          disabled={!document.image_uri || !document.image_uri.startsWith('http') || isDownloading || isDeleting}
          accessibilityLabel="Download image"
          accessibilityRole="button"
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color={Colors.white} style={styles.btnIcon} />
              <Text style={styles.btnPrimaryText}>Download</Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  headerBackButton: {
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
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerRightPlaceholder: {
    width: 60,
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
    height: 220,
    backgroundColor: '#F5F5F3',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  pdfPlaceholder: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  pdfMeta: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginTop: 8,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: '#666666',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  detailValue: {
    flex: 2,
    fontSize: Typography.sizes.sm,
    color: Colors.pureBlack,
    fontWeight: Typography.weights.medium,
    textAlign: 'right',
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
    }) as any),
  },
  btnSecondary: {
    flex: 1,
    height: 48,
    borderRadius: Radius.button,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  btnDangerText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#D32F2F',
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
  },
  errorText: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    marginBottom: Spacing.md,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryBlue,
    borderRadius: Radius.button,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: Typography.weights.semibold,
  },
});
