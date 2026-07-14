/**
 * OCRProcessingScreen.tsx
 *
 * Full-screen OCR processing view displayed while the OCR pipeline runs.
 *
 * Features:
 *  - Animated scanning indicator
 *  - Stage-by-stage progress animation
 *  - Cycling through messages with Animated API
 *  - No frozen screen — all operations are async
 *  - Cancel button returns to preview
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/theme';
import { ScannedDocument } from '../types/scanner.types';
import { OCRExtractionResult } from '../types/ocr.types';
import { useOCRPipeline } from '../hooks/useOCRPipeline';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Processing step labels (shown during animation) ─────────────────────────

const SCANNING_STEPS = [
  { icon: 'scan-outline',        label: 'Scanning document...' },
  { icon: 'text-outline',        label: 'Extracting text...' },
  { icon: 'eye-outline',         label: 'Recognizing characters...' },
  { icon: 'checkmark-circle-outline', label: 'Almost done...' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface OCRProcessingScreenProps {
  file: ScannedDocument;
  onSuccess: (result: OCRExtractionResult) => void;
  onError: (message: string) => void;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const OCRProcessingScreen: React.FC<OCRProcessingScreenProps> = ({
  file,
  onSuccess,
  onError,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const { runOCR, processingState, error, isProcessing } = useOCRPipeline();
  const hasStarted = useRef(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // ── Animations ──────────────────────────────────────────────────────────────
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [progressAnim] = useState(() => new Animated.Value(0));
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [rotateAnim] = useState(() => new Animated.Value(0));
  const [stepFadeAnim] = useState(() => new Animated.Value(1));

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Pulse animation for the scanning circle
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Rotate animation for spinner ring
  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    );
    rotate.start();
    return () => rotate.stop();
  }, [rotateAnim]);

  // Step cycling every 1.4s
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(stepFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(stepFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      setCurrentStepIndex(prev => (prev + 1) % SCANNING_STEPS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isProcessing, stepFadeAnim]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: processingState.progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [processingState.progress, progressAnim]);

  // ── Start OCR on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    runOCR(file).then(result => {
      if (result) {
        // Short delay so the "Complete!" state is visible
        setTimeout(() => onSuccess(result), 500);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle errors ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      onError(error.userMessage);
    }
  }, [error, onError]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
  });

  const currentStep = SCANNING_STEPS[currentStepIndex];

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.6 }]}
          onPress={onCancel}
          accessibilityLabel="Cancel OCR"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={22} color={Colors.darkGray} />
        </Pressable>
        <Text style={styles.headerTitle}>Processing Document</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>

        {/* Animated Scan Orb */}
        <View style={styles.orbContainer}>
          {/* Rotating outer ring */}
          <Animated.View
            style={[styles.spinnerRing, { transform: [{ rotate: rotateInterpolate }] }]}
          />
          {/* Pulsing inner circle */}
          <Animated.View
            style={[styles.orbInner, { transform: [{ scale: pulseAnim }] }]}
          >
            <Ionicons name="document-text" size={48} color={Colors.primaryBlue} />
          </Animated.View>
          {/* Corner scan indicators */}
          <View style={[styles.scanCorner, styles.topLeft]} />
          <View style={[styles.scanCorner, styles.topRight]} />
          <View style={[styles.scanCorner, styles.bottomLeft]} />
          <View style={[styles.scanCorner, styles.bottomRight]} />
        </View>

        {/* Step label */}
        <Animated.View style={[styles.stepContainer, { opacity: stepFadeAnim }]}>
          <Ionicons name={currentStep.icon as any} size={18} color={Colors.primaryBlue} />
          <Text style={styles.stepLabel}>{currentStep.label}</Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(processingState.progress)}%</Text>

        {/* File info card */}
        <View style={styles.fileCard}>
          <View style={styles.fileCardRow}>
            <Ionicons name="image-outline" size={16} color={Colors.darkGray} />
            <Text style={styles.fileCardText} numberOfLines={1} ellipsizeMode="middle">
              {file.name}
            </Text>
          </View>
          <View style={styles.fileCardRow}>
            <Ionicons
              name={file.source === 'camera' ? 'camera-outline' : 'images-outline'}
              size={16}
              color={Colors.darkGray}
            />
            <Text style={styles.fileCardText}>
              {file.source === 'camera' ? 'Camera capture' : 'Gallery import'} · {file.width}×{file.height}
            </Text>
          </View>
        </View>

        <Text style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={12} color={Colors.darkGray} />
          {' '}All processing happens on-device. Your document is never uploaded.
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const ORB_SIZE = 160;
const RING_SIZE = ORB_SIZE + 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cancelButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
  },
  headerPlaceholder: {
    width: 30,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 60,
    gap: 20,
  },
  orbContainer: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  spinnerRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: Colors.primaryBlue,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  orbInner: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: '#EEF4FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0E3FF',
  },
  scanCorner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: Colors.primaryBlue,
    borderWidth: 2.5,
  },
  topLeft:     { top: -2,    left: -2,    borderBottomWidth: 0, borderRightWidth: 0,  borderTopLeftRadius: 4 },
  topRight:    { top: -2,    right: -2,   borderBottomWidth: 0, borderLeftWidth: 0,   borderTopRightRadius: 4 },
  bottomLeft:  { bottom: -2, left: -2,    borderTopWidth: 0,    borderRightWidth: 0,  borderBottomLeftRadius: 4 },
  bottomRight: { bottom: -2, right: -2,   borderTopWidth: 0,    borderLeftWidth: 0,   borderBottomRightRadius: 4 },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F6FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  stepLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.primaryBlue,
  },
  progressTrack: {
    width: SCREEN_WIDTH * 0.72,
    height: 6,
    backgroundColor: '#E8EAED',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryBlue,
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginTop: -8,
  },
  fileCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  fileCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileCardText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  privacyNote: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
});
