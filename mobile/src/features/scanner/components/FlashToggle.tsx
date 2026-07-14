import React from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashMode } from '../hooks/useCamera';

interface FlashToggleProps {
  flash: FlashMode;
  onPress: () => void;
}

export const FlashToggle: React.FC<FlashToggleProps> = ({ flash, onPress }) => {
  const getIconName = () => {
    switch (flash) {
      case 'on':
        return 'flash';
      case 'auto':
        return 'flash';
      case 'off':
      default:
        return 'flash-off';
    }
  };

  const getIconColor = () => {
    switch (flash) {
      case 'on':
        return '#FF9800'; // Amber/Orange Theme Accent
      case 'auto':
        return '#1977F3'; // Primary Blue
      case 'off':
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      accessibilityLabel={`Toggle flash. Current mode is ${flash}`}
      accessibilityRole="button"
    >
      <Ionicons name={getIconName() as any} size={22} color={getIconColor()} />
      {flash === 'auto' && (
        <View style={styles.autoBadge}>
          <Text style={styles.autoText}>A</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  autoBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#1977F3',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
