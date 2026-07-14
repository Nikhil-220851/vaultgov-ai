import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { ScannedDocument } from '../types/scanner.types';

export async function pickImageFromGallery(): Promise<ScannedDocument | null> {
  console.log('[ScannerImageService] Opening gallery...');
  try {
    const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      if (!canAskAgain) {
        Alert.alert(
          'Gallery Permission Required',
          'Gallery access has been denied. Please enable it in your device settings to select documents.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert(
          'Gallery Permission Denied',
          'Gallery permission is required to select documents.',
          [{ text: 'OK' }]
        );
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
      base64: false,
    });

    if (result.canceled) {
      console.log('[ScannerImageService] Gallery selection cancelled by user');
      return null;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    
    // Validate file type
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      Alert.alert('Invalid File Type', 'Please select a valid image file.');
      return null;
    }

    // Get size via expo-file-system if not provided by image-picker
    let size = asset.fileSize;
    if (size === undefined) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          size = fileInfo.size;
        }
      } catch (err) {
        console.warn('[OCR] Failed to read file size:', err);
      }
    }

    const fileName = asset.fileName ?? uri.split('/').pop() ?? `gallery_${Date.now()}.jpg`;

    console.log('[ScannerImageService] Image selected successfully:', {
      uri,
      width: asset.width,
      height: asset.height,
      size,
      fileName,
    });

    return {
      uri,
      name: fileName,
      mimeType,
      width: asset.width,
      height: asset.height,
      size,
      source: 'gallery',
    };
  } catch (error) {
    console.error('[ScannerImageService] Gallery selection error:', error);
    Alert.alert('Error', 'An error occurred while opening the gallery.');
    return null;
  }
}
