import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ScannedDocument } from '../types/scanner.types';
import { pickImageFromGallery } from '../services/image.service';

interface PreviewScreenProps {
  initialFile: ScannedDocument;
}

export const PreviewScreen: React.FC<PreviewScreenProps> = ({ initialFile }) => {
  const router = useRouter();
  const [file, setFile] = useState<ScannedDocument>(initialFile);

  const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === 0) return 'Unknown Size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRetake = () => {
    console.log('[PreviewScreen] Retake pressed');
    router.replace('/scan/camera' as any);
  };

  const handleChooseAnother = async () => {
    console.log('[PreviewScreen] Choose Another pressed');
    const newDoc = await pickImageFromGallery();
    if (newDoc) {
      console.log('[PreviewScreen] New image selected:', newDoc.name);
      setFile(newDoc);
    }
  };

  const handleContinue = () => {
    console.log('[PreviewScreen] Continue pressed — navigating to OCR processing');
    router.push({
      pathname: '/scan/ocr-processing' as any,
      params: {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? String(file.size) : '',
        width: String(file.width),
        height: String(file.height),
        source: file.source,
      },
    });
  };

  const handleCancel = () => {
    console.log('[PreviewScreen] Cancel pressed');
    router.dismissAll();
  };

  return (
    <ScreenContainer safeAreaStyle={styles.safeArea} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]} 
          onPress={handleCancel}
          accessibilityLabel="Cancel scan"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={Colors.pureBlack} />
        </Pressable>
        <Text style={styles.headerTitle}>Preview Document</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Document Preview Card */}
        <View style={styles.imageCard}>
          <Image source={{ uri: file.uri }} style={styles.previewImage} contentFit="contain" />
        </View>

        {/* File Metadata Info */}
        <View style={styles.metaContainer}>
          <Text style={styles.metaTitle}>Document Details</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>File Name</Text>
            <Text style={styles.metaValue} numberOfLines={1} ellipsizeMode="middle">
              {file.name}
            </Text>
          </View>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>File Size</Text>
            <Text style={styles.metaValue}>{formatSize(file.size)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Resolution</Text>
            <Text style={styles.metaValue}>{`${file.width} x ${file.height}`}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Source</Text>
            <Text style={[styles.metaValue, styles.sourceValue]}>
              {file.source === 'camera' ? 'Camera Capture' : 'Gallery Selection'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <View style={styles.actionRow}>
          {file.source === 'camera' ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.8 }]}
              onPress={handleRetake}
              accessibilityLabel="Retake document photo"
              accessibilityRole="button"
            >
              <Ionicons name="refresh-outline" size={20} color={Colors.primaryBlue} />
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.8 }]}
              onPress={handleChooseAnother}
              accessibilityLabel="Choose another image from gallery"
              accessibilityRole="button"
            >
              <Ionicons name="images-outline" size={20} color={Colors.primaryBlue} />
              <Text style={styles.secondaryButtonText}>Choose Another</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}
            onPress={handleContinue}
            accessibilityLabel="Continue to OCR analysis"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
  },
  container: {
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.pureBlack,
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 140, // ensure space for floating footer
  },
  imageCard: {
    width: '100%',
    height: 380,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  metaContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  metaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.pureBlack,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  metaLabel: {
    fontSize: 13,
    color: Colors.darkGray,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.pureBlack,
    maxWidth: '60%',
  },
  sourceValue: {
    textTransform: 'capitalize',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1.2,
    backgroundColor: Colors.pureBlack,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.white,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: Colors.primaryBlue,
    fontSize: 16,
    fontWeight: '600',
  },
});
