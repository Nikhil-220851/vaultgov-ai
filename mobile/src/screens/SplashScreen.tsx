import React, { useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AppLogo } from '../components/AppLogo';
import { LoadingBar } from '../components/LoadingBar';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation Shared Values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.7);

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(15);

  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(15);

  useEffect(() => {
    // 1. Logo entrance: Fade In + Scale (600ms)
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.back(1.5)),
    });
    logoScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.back(1.5)),
    });

    // 2. Title entrance: Fade Up with 200ms delay
    titleOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.quad),
      })
    );
    titleTranslateY.value = withDelay(
      200,
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.quad),
      })
    );

    // 3. Subtitle entrance: Fade Up with 400ms delay
    subtitleOpacity.value = withDelay(
      400,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.quad),
      })
    );
    subtitleTranslateY.value = withDelay(
      400,
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.quad),
      })
    );

    // 4. Auto-advance callback after 2500ms (duration of splash)
    const timeout = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, [logoOpacity, logoScale, titleOpacity, titleTranslateY, subtitleOpacity, subtitleTranslateY, onFinish]);

  // Animated Styles
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Large empty spacing at top */}
      <View style={styles.topSpacer} />

      {/* Centered logo, title, subtitle, progress bar, loading text */}
      <View style={styles.contentContainer}>
        {/* App Logo */}
        <Animated.View style={logoStyle}>
          <AppLogo />
        </Animated.View>

        {/* 24px spacing */}
        <View style={styles.spacing24} />

        {/* Title */}
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>VaultGov AI</Text>
        </Animated.View>

        {/* 8px spacing */}
        <View style={styles.spacing8} />

        {/* Subtitle */}
        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>Government document intelligence</Text>
        </Animated.View>

        {/* 48px spacing */}
        <View style={styles.spacing48} />

        {/* Loading Progress Bar */}
        <LoadingBar duration={2500} />

        {/* 12px spacing */}
        <View style={styles.spacing12} />

        {/* Loading text */}
        <Text style={styles.loadingText}>Loading...</Text>
      </View>

      {/* Flexible Spacer */}
      <View style={styles.bottomSpacer} />

      {/* Bottom info text */}
      <Text style={styles.bottomText}>Auto-advances after 2–3s</Text>
      
      {/* Bottom padding for Android navigation bar */}
      <View style={styles.bottomPadding} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topSpacer: {
    flex: 1.5,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    flex: 2.2,
  },
  spacing24: {
    height: 24,
  },
  spacing8: {
    height: 8,
  },
  spacing48: {
    height: 48,
  },
  spacing12: {
    height: 12,
  },
  title: {
    fontFamily: typography.fontFamily.title,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.regular,
    color: colors.darkGray,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.darkGray,
    opacity: 0.8,
  },
  bottomText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bottom,
    fontWeight: typography.weights.regular,
    color: colors.darkGray,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 0 : 8,
  },
});
