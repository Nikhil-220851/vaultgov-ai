import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Colors } from '@/theme';

export function VerifyIllustration() {
  const scanAnim = useSharedValue(0);

  useEffect(() => {
    scanAnim.value = withRepeat(
      withSequence(
        withTiming(110, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      false
    );
  }, [scanAnim]);

  const animatedLaserStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scanAnim.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Background Circle Glow */}
      <View style={styles.glowCircle} />

      {/* ID Card Wrapper */}
      <View style={styles.cardFrame}>
        {/* User avatar mockup */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar} />
          <View style={styles.lines}>
            <View style={styles.lineLong} />
            <View style={styles.lineShort} />
          </View>
        </View>

        {/* QR Code Graphic */}
        <View style={styles.qrContainer}>
          <View style={styles.qrBlock} />
          <View style={styles.qrBlock} />
          <View style={styles.qrBlock} />
          <View style={styles.qrBlock} />
        </View>

        {/* Scanning Laser Line */}
        <Animated.View style={[styles.laser, animatedLaserStyle]} />
      </View>

      {/* Verification Badge (Green) */}
      <View style={styles.badge}>
        <View style={styles.badgeCheck} />
      </View>
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
    backgroundColor: '#EAF8EE', // soft green/orange glow tint
    opacity: 0.8,
  },
  cardFrame: {
    width: 120,
    height: 120,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryGreen,
    padding: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: Colors.primaryGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  lines: {
    flex: 1,
    gap: 4,
  },
  lineLong: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    width: '80%',
  },
  lineShort: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    width: '50%',
  },
  qrContainer: {
    width: 44,
    height: 44,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 4,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 4,
  },
  qrBlock: {
    width: 15,
    height: 15,
    backgroundColor: Colors.pureBlack,
    borderRadius: 2,
  },
  laser: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 5,
    height: 3,
    backgroundColor: Colors.primaryOrange,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  badgeCheck: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.white,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
});
