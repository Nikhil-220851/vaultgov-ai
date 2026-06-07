import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GoogleIcon } from './icons/GoogleIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { ArrowIcon } from './icons/ArrowIcon';
import { AuthButtonProps } from '../types/auth.types';
import { styles } from '../styles/auth.styles';

export function AuthButton({
  title,
  iconType,
  onPress,
  loading = false,
  disabled = false,
}: AuthButtonProps) {
  const IconComponent = iconType === 'google' ? GoogleIcon : PhoneIcon;
  // Visual variant: Google = primary blue solid; OTP = outlined secondary
  const isPrimary = iconType === 'google';

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        isPrimary ? styles.authButton : styles.authButtonSecondary,
        (disabled || loading) && styles.authButtonDisabled,
      ]}
    >
      <View style={styles.authButtonContent}>
        {/* Left Icon Badge Container */}
        <View style={isPrimary ? styles.iconBadge : styles.iconBadgeSecondary}>
          <IconComponent isPrimary={isPrimary} />
        </View>

        {/* Centered Button Title */}
        <View style={styles.textContainer}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isPrimary ? '#FFFFFF' : '#1977F3'}
            />
          ) : (
            <Text
              style={
                isPrimary
                  ? styles.authButtonText
                  : styles.authButtonTextSecondary
              }
            >
              {title}
            </Text>
          )}
        </View>

        {/* Right Arrow Icon */}
        <View style={styles.arrowContainer}>
          <ArrowIcon isPrimary={isPrimary} />
        </View>
      </View>
    </AnimatedPressable>
  );
}
