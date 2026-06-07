import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GoogleIcon } from './icons/GoogleIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { ArrowIcon } from './icons/ArrowIcon';
import { AuthButtonProps } from '../types/auth.types';
import { styles } from '../styles/auth.styles';
import { Colors } from '@/theme';

export function AuthButton({
  title,
  iconType,
  onPress,
  loading = false,
  disabled = false,
}: AuthButtonProps) {
  const IconComponent = iconType === 'google' ? GoogleIcon : PhoneIcon;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.authButton,
        (disabled || loading) && styles.authButtonDisabled,
      ]}
    >
      <View style={styles.authButtonContent}>
        {/* Left Icon Badge Container */}
        <View style={styles.iconBadge}>
          <IconComponent />
        </View>

        {/* Centered Button Title */}
        <View style={styles.textContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primaryBlue} />
          ) : (
            <Text style={styles.authButtonText}>{title}</Text>
          )}
        </View>

        {/* Right Arrow Icon */}
        <View style={styles.arrowContainer}>
          <ArrowIcon />
        </View>
      </View>
    </AnimatedPressable>
  );
}
