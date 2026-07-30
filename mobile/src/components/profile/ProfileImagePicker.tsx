import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable, Platform, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Spacing } from '@/theme';
import { apiClient } from '@/services/api';

export interface ProfileImagePickerProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (url: string | null) => void;
}

export function ProfileImagePicker({ visible, onClose, onImageSelected }: ProfileImagePickerProps) {
  const [loading, setLoading] = React.useState(false);

  const processAndUploadImage = async (uri: string) => {
    try {
      setLoading(true);

      // Crop to square and compress
      const manipulatedResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Upload to backend
      const result = await apiClient.uploadProfileImage(manipulatedResult.uri);
      onImageSelected(result.secure_url);
    } catch (error: any) {
      console.error('[ProfileImagePicker] Upload failed', error);
      Alert.alert('Upload Failed', 'Could not upload profile picture. Please try again.');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        await processAndUploadImage(result.assets[0].uri);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('[ProfileImagePicker] Gallery error', error);
      onClose();
    }
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to take a photo.');
        onClose();
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        await processAndUploadImage(result.assets[0].uri);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('[ProfileImagePicker] Camera error', error);
      onClose();
    }
  };

  const handleRemove = () => {
    onImageSelected(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} disabled={loading} />
        <View style={styles.sheet}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryBlue} />
              <Text style={styles.loadingText}>Uploading picture...</Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Profile Picture</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={Colors.darkGray} />
                </Pressable>
              </View>

              <View style={styles.optionsContainer}>
                <Pressable style={styles.optionBtn} onPress={handleGallery}>
                  <View style={[styles.iconWrap, { backgroundColor: '#E8F1FF' }]}>
                    <Ionicons name="images-outline" size={24} color={Colors.primaryBlue} />
                  </View>
                  <Text style={styles.optionText}>Choose from Gallery</Text>
                </Pressable>

                <Pressable style={styles.optionBtn} onPress={handleCamera}>
                  <View style={[styles.iconWrap, { backgroundColor: '#E8F1FF' }]}>
                    <Ionicons name="camera-outline" size={24} color={Colors.primaryBlue} />
                  </View>
                  <Text style={styles.optionText}>Take a Photo</Text>
                </Pressable>

                <Pressable style={styles.optionBtn} onPress={handleRemove}>
                  <View style={[styles.iconWrap, { backgroundColor: '#FFEEEE' }]}>
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  </View>
                  <Text style={[styles.optionText, { color: '#FF3B30' }]}>Remove Photo</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    minHeight: 250,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
  },
  closeBtn: {
    padding: 4,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.pureBlack,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
  },
});
