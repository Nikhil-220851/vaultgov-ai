import React, { useState } from 'react';
import { StyleSheet, Pressable, Animated, View } from 'react-native';

interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({ onPress, disabled = false }) => {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      tension: 40,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 3,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel="Capture document"
      accessibilityRole="button"
      style={styles.container}
    >
      <Animated.View style={[styles.outerCircle, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.innerCircle, disabled && styles.disabledInner]} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  innerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  disabledInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
