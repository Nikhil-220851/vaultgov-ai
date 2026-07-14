import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, ActivityIndicator, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useCamera } from '../hooks/useCamera';
import { CameraOverlay } from '../components/CameraOverlay';
import { CaptureButton } from '../components/CaptureButton';
import { FlashToggle } from '../components/FlashToggle';
import { GalleryButton } from '../components/GalleryButton';
import { pickImageFromGallery } from '../services/image.service';
import { Colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export const CameraScreen: React.FC = () => {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const {
    hasPermission,
    flash,
    isCameraReady,
    setIsCameraReady,
    isCapturing,
    setIsCapturing,
    requestPermission,
    toggleFlash,
  } = useCamera();

  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing) return;

    try {
      setIsCapturing(true);
      console.log('[CameraScreen] Capturing image...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });

      if (!photo) {
        throw new Error('Capture returned null');
      }

      console.log('[CameraScreen] Image captured successfully:', photo.uri);

      // Get file size using FileSystem
      let fileSize: number | undefined;
      try {
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);
        if (fileInfo.exists) {
          fileSize = fileInfo.size;
        }
      } catch (err) {
        console.warn('[CameraScreen] Failed to read captured file size:', err);
      }

      const fileName = `photo_${Date.now()}.jpg`;

      router.push({
        pathname: '/scan/preview' as any,
        params: {
          uri: photo.uri,
          name: fileName,
          mimeType: 'image/jpeg',
          width: String(photo.width),
          height: String(photo.height),
          size: fileSize !== undefined ? String(fileSize) : '',
          source: 'camera',
        },
      });
    } catch (error) {
      console.error('[CameraScreen] Capture failure:', error);
      Alert.alert('Capture Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleGalleryPress = async () => {
    const document = await pickImageFromGallery();
    if (document) {
      router.replace({
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

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryBlue} />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.deniedContainer}>
        <View style={styles.deniedIconWrapper}>
          <Ionicons name="camera-outline" size={48} color={Colors.dangerRed} />
        </View>
        <Text style={styles.deniedTitle}>Camera Access Required</Text>
        <Text style={styles.deniedDescription}>
          VaultGov AI needs camera permissions to scan your physical documents securely.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9 }]}
          onPress={requestPermission}
        >
          <Text style={styles.actionButtonText}>Grant Permission</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.8 }]}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.settingsButtonText}>Open Device Settings</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cancelLink, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
        ref={cameraRef}
        onCameraReady={() => {
          console.log('[CameraScreen] Camera is ready');
          setIsCameraReady(true);
        }}
      />

      {/* Grid Overlay Guide */}
      <CameraOverlay />

      {/* Header HUD Controls */}
      <View style={styles.headerHud}>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          accessibilityLabel="Back to scanner landing"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        
        <FlashToggle flash={flash} onPress={toggleFlash} />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomHud}>
        <View style={styles.bottomButtonsRow}>
          {/* Gallery Picker Shortcut */}
          <GalleryButton onPress={handleGalleryPress} />
          
          {/* Large Shutter Button */}
          <CaptureButton onPress={handleCapture} disabled={!isCameraReady || isCapturing} />
          
          {/* Symmetrical Spacing Placeholder */}
          <View style={styles.placeholderButton} />
        </View>
      </View>

      {/* Capturing Overlay */}
      {isCapturing && (
        <View style={styles.capturingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.capturingText}>Capturing Document...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#707070',
    fontWeight: '500',
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
  },
  deniedIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.pureBlack,
    marginBottom: 10,
    textAlign: 'center',
  },
  deniedDescription: {
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: Colors.pureBlack,
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsButtonText: {
    color: Colors.primaryBlue,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelLink: {
    padding: 8,
  },
  cancelLinkText: {
    fontSize: 15,
    color: Colors.darkGray,
    fontWeight: '500',
  },
  headerHud: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bottomHud: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
  },
  placeholderButton: {
    width: 50,
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  capturingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
