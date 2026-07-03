/**
 * upload.service.ts
 *
 * Handles file selection for the Upload Document sheet.
 * Uses expo-camera for camera capture, expo-image-picker for gallery,
 * and expo-document-picker for PDFs.
 *
 * Returns a typed SelectedFile result — ready for future backend upload.
 * All permission denial and cancellation is handled gracefully here so
 * callers don't need to deal with error states.
 */

import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';

export interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  source: 'camera' | 'gallery' | 'pdf';
}

// ─── Camera Capture ──────────────────────────────────────────────────────────

export async function captureWithCamera(): Promise<SelectedFile | null> {
  try {
    // Check and request camera permission
    const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();

    if (status !== 'granted') {
      if (!canAskAgain) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access has been denied. Please enable it in your device settings to capture documents.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const { status: newStatus } = await Camera.requestCameraPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert(
          'Camera Permission Denied',
          'Camera permission is required to capture documents.',
          [{ text: 'OK' }]
        );
        return null;
      }
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      base64: false,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    const fileName = asset.fileName ?? `photo_${Date.now()}.jpg`;

    return {
      uri: asset.uri,
      name: fileName,
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize,
      source: 'camera',
    };
  } catch (error) {
    console.error('[UploadService] Camera capture error:', error);
    return null;
  }
}

// ─── Image Gallery Pick ──────────────────────────────────────────────────────

export async function pickFromGallery(): Promise<SelectedFile | null> {
  try {
    // On iOS 14+, expo-image-picker uses the limited photo library access;
    // on Android, it handles media permissions internally.
    const { status, canAskAgain } =
      await ImagePicker.getMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      if (!canAskAgain) {
        Alert.alert(
          'Photo Library Permission Required',
          'Photo access has been denied. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const { status: newStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert(
          'Photo Library Permission Denied',
          'Permission to access the photo library is required to upload images.',
          [{ text: 'OK' }]
        );
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      base64: false,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    const fileName = asset.fileName ?? `image_${Date.now()}.jpg`;

    return {
      uri: asset.uri,
      name: fileName,
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize,
      source: 'gallery',
    };
  } catch (error) {
    console.error('[UploadService] Gallery pick error:', error);
    return null;
  }
}

// ─── PDF Document Pick ───────────────────────────────────────────────────────

export async function pickPdfDocument(): Promise<SelectedFile | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: Platform.OS === 'ios' ? 'com.adobe.pdf' : 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    // Cancelled by user
    if (result.canceled) return null;

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
      size: asset.size,
      source: 'pdf',
    };
  } catch (error) {
    console.error('[UploadService] PDF pick error:', error);
    return null;
  }
}
