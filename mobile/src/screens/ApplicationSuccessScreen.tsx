"use no memo";
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme/colors';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export function ApplicationSuccessScreen() {
  const router = useRouter();
  const { applicationId, schemeName, processingTime } = useLocalSearchParams<{
    applicationId: string;
    schemeName: string;
    processingTime: string;
  }>();

  const applicationDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Animation values
  const circleScale = useSharedValue(0);
  const circleOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const btnsOpacity = useSharedValue(0);
  const btnsTranslateY = useSharedValue(20);
  const pulseScale = useSharedValue(1);

  // Guard to prevent stale animation callbacks from firing after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // 1. Circle fade-in + scale
    circleOpacity.value = withTiming(1, { duration: 400 });
    circleScale.value = withSpring(1, { damping: 12, stiffness: 120 });

    // 2. Checkmark pop
    checkScale.value = withDelay(
      300,
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    // 3. Title
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
    titleTranslateY.value = withDelay(500, withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }));

    // 4. Info Card
    cardOpacity.value = withDelay(700, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
    cardTranslateY.value = withDelay(700, withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }));

    // 5. Buttons
    btnsOpacity.value = withDelay(900, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
    btnsTranslateY.value = withDelay(900, withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }));

    // 6. Pulse loop on circle — guarded so callbacks never fire after unmount.
    //    cancelAnimation() in the cleanup stops any in-flight animation immediately.
    const runPulse = () => {
      if (!isMounted.current) return;
      pulseScale.value = withTiming(1.1, { duration: 800 }, (finished) => {
        if (finished && isMounted.current) {
          pulseScale.value = withTiming(1, { duration: 800 }, (f2) => {
            if (f2 && isMounted.current) runPulse();
          });
        }
      });
    };
    const t = setTimeout(runPulse, 1200);

    return () => {
      isMounted.current = false;
      clearTimeout(t);
      cancelAnimation(pulseScale);
    };
  }, [circleOpacity, circleScale, checkScale, titleOpacity, titleTranslateY, cardOpacity, cardTranslateY, btnsOpacity, btnsTranslateY, pulseScale, isMounted]);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const btnsStyle = useAnimatedStyle(() => ({
    opacity: btnsOpacity.value,
    transform: [{ translateY: btnsTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.container}>
        {/* ─── Success Animation ───────────────────────────────────────── */}
        <View style={styles.animationSection}>
          {/* Outer pulse ring */}
          <Animated.View style={[styles.pulseRing, pulseStyle]} />

          {/* Main circle */}
          <Animated.View style={[styles.successCircle, circleStyle]}>
            {/* Checkmark */}
            <Animated.View style={checkStyle}>
              <Ionicons name="checkmark" size={52} color={colors.white} />
            </Animated.View>
          </Animated.View>
        </View>

        {/* ─── Title & Subtitle ────────────────────────────────────────── */}
        <Animated.View style={[styles.titleSection, titleStyle]}>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your application for{' '}
            <Text style={styles.successSchemeName}>{schemeName || 'the scheme'}</Text>
            {' '}has been successfully submitted.
          </Text>
        </Animated.View>

        {/* ─── Info Card ───────────────────────────────────────────────── */}
        <Animated.View style={[styles.infoCard, cardStyle]}>
          <InfoRow
            icon="barcode-outline"
            label="Application ID"
            value={applicationId || 'VG-2026-000000'}
            highlight
          />
          <View style={styles.infoDivider} />
          <InfoRow
            icon="calendar-outline"
            label="Application Date"
            value={applicationDate}
          />
          <View style={styles.infoDivider} />
          <InfoRow
            icon="time-outline"
            label="Expected Review Time"
            value={processingTime || '30–60 working days'}
          />
          <View style={styles.infoDivider} />
          <InfoRow
            icon="cash-outline"
            label="Application Fee"
            value="₹0 — Free of charge"
          />

          {/* Status Banner */}
          <View style={styles.statusBanner}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Under Review — Submitted Successfully</Text>
          </View>
        </Animated.View>

        {/* ─── Note ────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.noteBox, cardStyle]}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.darkGray} />
          <Text style={styles.noteText}>
            You will receive an SMS and notification when your application status changes.
            Keep your documents ready for verification.
          </Text>
        </Animated.View>

        {/* ─── Action Buttons ───────────────────────────────────────────── */}
        <Animated.View style={[styles.btnContainer, btnsStyle]}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => router.replace('/(tabs)/schemes' as any)}
            activeOpacity={0.88}
          >
            <Ionicons name="pulse-outline" size={18} color={colors.white} />
            <Text style={styles.trackBtnText}>Track Application</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/(tabs)/home' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color={colors.black} />
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: any;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={highlight ? colors.primary : Colors.darkGray} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 8 : Spacing.md,
    alignItems: 'center',
  },
  // ── Animation ──────────────────────────────────────────────────────────────
  animationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    width: 140,
    height: 140,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3CC55620',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3CC556',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3CC556',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  // ── Title ──────────────────────────────────────────────────────────────────
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: Typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  successSchemeName: {
    fontWeight: Typography.weights.bold,
    color: colors.black,
  },
  // ── Info Card ──────────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: colors.black,
  },
  infoValueHighlight: {
    color: colors.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EDFBF0',
    borderRadius: Radius.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3CC556',
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: '#3CC556',
  },
  // ── Note ──────────────────────────────────────────────────────────────────
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    backgroundColor: '#F5F5F7',
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: Spacing.md,
  },
  noteText: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    lineHeight: 18,
    flex: 1,
  },
  // ── Buttons ────────────────────────────────────────────────────────────────
  btnContainer: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: 'auto',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: Radius.button,
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  trackBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: colors.white,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: colors.white,
  },
  homeBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: colors.black,
  },
});
