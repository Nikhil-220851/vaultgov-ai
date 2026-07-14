import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { pickImageFromGallery } from '../services/image.service';

export const ScanDocumentScreen: React.FC = () => {
  const router = useRouter();

  const handleCameraPress = () => {
    console.log('[ScanDocumentScreen] Camera button pressed');
    router.push('/scan/camera' as any);
  };

  const handleGalleryPress = async () => {
    console.log('[ScanDocumentScreen] Gallery button pressed');
    const document = await pickImageFromGallery();
    if (document) {
      console.log('[ScanDocumentScreen] Image selected, routing to preview');
      router.push({
        pathname: '/scan/preview' as any,
        params: {
          uri: document.uri,
          name: document.name,
          mimeType: document.mimeType,
          width: String(document.width),
          height: String(document.height),
          size: document.size !== undefined ? String(document.size) : '',
          source: document.source,
        },
      });
    }
  };

  return (
    <ScreenContainer safeAreaStyle={styles.safeArea} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]} 
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.pureBlack} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Document</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {/* Decorative scan icon illustration */}
        <View style={styles.iconWrapper}>
          <Ionicons name="document-text-outline" size={60} color={Colors.primaryBlue} />
        </View>

        <Text style={styles.title}>Secure Document Scanner</Text>
        <Text style={styles.description}>
          Capture or upload government forms, applications, tax files, or other identity proofs. All documents are processed securely.
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.9 },
            ]}
            onPress={handleCameraPress}
            accessibilityLabel="Capture with camera"
            accessibilityRole="button"
          >
            <Ionicons name="camera-outline" size={22} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Capture with Camera</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleGalleryPress}
            accessibilityLabel="Select from gallery"
            accessibilityRole="button"
          >
            <Ionicons name="images-outline" size={22} color={Colors.primaryBlue} />
            <Text style={styles.secondaryButtonText}>Upload from Gallery</Text>
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
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.pureBlack,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.pureBlack,
    height: 54,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: Colors.primaryBlue,
    fontSize: 16,
    fontWeight: '600',
  },
});
