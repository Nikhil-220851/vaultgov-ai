import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Colors } from '@/theme';

export function CloudIllustration() {
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [pulseAnim]);

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Background Circle Glow */}
      <View style={styles.glowCircle} />

      {/* Cloud Base */}
      <View style={styles.cloudWrapper}>
        {/* Drawn Cloud Shape */}
        <View style={styles.cloudLeft} />
        <View style={styles.cloudRight} />
        <View style={styles.cloudCenter} />
        <View style={styles.cloudBottom} />
      </View>

      {/* Mobile Device Silhouette */}
      <View style={styles.phoneFrame}>
        {/* Screen Content Lines */}
        <View style={styles.phoneDoc}>
          <View style={styles.phoneDocLine} />
          <View style={styles.phoneDocLine} />
        </View>
        {/* Home bar mockup */}
        <View style={styles.homeBar} />
      </View>

      {/* Secure Shield Overlay */}
      <Animated.View style={[styles.shieldContainer, animatedPulseStyle]}>
        <View style={styles.shield}>
          <View style={styles.shieldCheck} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.softBlue,
    opacity: 0.3,
  },
  cloudWrapper: {
    position: 'absolute',
    width: 100,
    height: 60,
    top: 35,
    left: 25,
  },
  cloudLeft: {
    position: 'absolute',
    left: 5,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1E7F8',
  },
  cloudRight: {
    position: 'absolute',
    right: 5,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E1E7F8',
  },
  cloudCenter: {
    position: 'absolute',
    left: 25,
    top: 5,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E1E7F8',
  },
  cloudBottom: {
    position: 'absolute',
    left: 15,
    bottom: 0,
    width: 70,
    height: 25,
    backgroundColor: '#E1E7F8',
  },
  phoneFrame: {
    position: 'absolute',
    bottom: 25,
    right: 30,
    width: 44,
    height: 76,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.pureBlack,
    padding: 6,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  homeBar: {
    width: 16,
    height: 2,
    backgroundColor: Colors.pureBlack,
    borderRadius: 1,
    alignSelf: 'center',
  },
  phoneDoc: {
    gap: 3,
    marginTop: 4,
  },
  phoneDocLine: {
    height: 2,
    backgroundColor: '#E0E0E0',
    borderRadius: 1,
  },
  shieldContainer: {
    position: 'absolute',
    top: 60,
    left: 70,
  },
  shield: {
    width: 32,
    height: 38,
    backgroundColor: Colors.primaryBlue,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  shieldCheck: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.white,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
});
