/**
 * OCRStatusBanner.tsx
 *
 * Displays the current OCR extraction state as a full-width banner.
 * Uses Primary Blue / Soft Blue theme tokens.
 *
 * States:
 *  processing – animated spinner + text
 *  success    – success indicator
 *  partial    – partial success indicator
 *  failed     – error message
 *  idle       – renders nothing
 */

import React, { useEffect, useState } from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { OCRStatus } from '../services/ocr.service';

interface OCRStatusBannerProps {
  status: OCRStatus;
}

export const OCRStatusBanner: React.FC<OCRStatusBannerProps> = ({ status }) => {
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (status === 'idle') {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [status, fadeAnim]);


  if (status === 'idle') return null;

  const config = getBannerConfig(status);

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor: config.bg, opacity: fadeAnim }]}
      accessibilityLabel={`OCR status: ${config.text}`}
      accessibilityLiveRegion="polite"
    >
      {status === 'processing' ? (
        <ActivityIndicator
          size="small"
          color={config.iconColor}
          style={styles.spinner}
        />
      ) : (
        <Ionicons
          name={config.iconName as any}
          size={16}
          color={config.iconColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: config.textColor }]}>{config.text}</Text>
    </Animated.View>
  );
};

// ─── Banner config per status ─────────────────────────────────────────────────

interface BannerConfig {
  bg: string;
  iconName: string;
  iconColor: string;
  textColor: string;
  text: string;
}

function getBannerConfig(status: OCRStatus): BannerConfig {
  switch (status) {
    case 'processing':
      return {
        bg: '#EAF1FD',
        iconName: 'sync-outline',
        iconColor: Colors.primaryBlue,
        textColor: Colors.primaryBlue,
        text: 'OCR processing… extracting text',
      };
    case 'success':
      return {
        bg: '#EBF9EF',
        iconName: 'checkmark-circle-outline',
        iconColor: '#3CC556',
        textColor: '#2A9744',
        text: 'Text extracted successfully',
      };
    case 'partial':
      return {
        bg: '#FFF8E6',
        iconName: 'warning-outline',
        iconColor: Colors.primaryOrange,
        textColor: '#A66200',
        text: 'Partial extraction — some fields not found',
      };
    case 'failed':
      return {
        bg: '#FEF0F0',
        iconName: 'close-circle-outline',
        iconColor: Colors.dangerRed,
        textColor: '#C0392B',
        text: 'Details not found — please retake or choose another file',
      };
    default:
      return {
        bg: '#EAF1FD',
        iconName: 'information-circle-outline',
        iconColor: Colors.primaryBlue,
        textColor: Colors.primaryBlue,
        text: '',
      };
  }
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  spinner: {
    marginRight: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamilies.sans,
    fontWeight: Typography.weights.medium,
  },
});

export default OCRStatusBanner;
