import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GalleryButtonProps {
  onPress: () => void;
}

export const GalleryButton: React.FC<GalleryButtonProps> = ({ onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      accessibilityLabel="Open photo library"
      accessibilityRole="button"
    >
      <Ionicons name="images-outline" size={24} color="#FFFFFF" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});
