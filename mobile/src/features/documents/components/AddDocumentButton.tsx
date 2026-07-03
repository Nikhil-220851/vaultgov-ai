import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors } from '@/theme';
import { styles } from '../documents.styles';

interface AddDocumentButtonProps {
  onPress: () => void;
}

export const AddDocumentButton: React.FC<AddDocumentButtonProps> = ({ onPress }) => {
  return (
    <AnimatedPressable
      accessibilityLabel="Add document"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.fab}
    >
      <Ionicons name="add" size={30} color={Colors.white} />
    </AnimatedPressable>
  );
};

export default AddDocumentButton;

