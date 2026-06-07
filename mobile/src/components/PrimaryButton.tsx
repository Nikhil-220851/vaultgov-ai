import React from 'react';
import { StyleSheet, Text, ActivityIndicator, ViewStyle, TextStyle, StyleProp, Platform } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { Typography, Radius, Spacing } from '@/theme';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
}: PrimaryButtonProps) {
  const isButtonDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isButtonDisabled}
      style={[
        styles.button,
        isButtonDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1977F3',        // Primary Blue
    height: 56,                        // Professional fintech/mobile height
    borderRadius: Radius.button,       // 14px consistent rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    ...Platform.select({
      ios: {
        shadowColor: '#1977F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(25, 119, 243, 0.2)',
      },
    }),
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: Typography.sizes.md,     // 16px button text
    fontWeight: Typography.weights.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
