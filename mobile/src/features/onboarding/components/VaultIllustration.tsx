import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Colors } from '@/theme';

export function VaultIllustration() {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [floatAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatAnim.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Background Circle Glow */}
      <View style={styles.glowCircle} />

      {/* Floating vault elements */}
      <Animated.View style={[styles.vaultWrapper, animatedStyle]}>
        {/* The Vault Shape */}
        <View style={styles.vaultBody}>
          {/* Dial lock */}
          <View style={styles.dialOuter}>
            <View style={styles.dialInner} />
          </View>
          {/* Status light */}
          <View style={styles.statusIndicator} />
        </View>

        {/* Secure Document slipping in */}
        <View style={styles.document}>
          <View style={styles.docLineLong} />
          <View style={styles.docLineShort} />
          <View style={styles.docLineLong} />
        </View>

        {/* Shield */}
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
    opacity: 0.35,
  },
  vaultWrapper: {
    width: 120,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultBody: {
    width: 76,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  dialOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  dialInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryBlue,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryGreen,
  },
  document: {
    position: 'absolute',
    top: -15,
    left: 10,
    width: 36,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primaryBlue,
    padding: 6,
    justifyContent: 'space-between',
    zIndex: -1,
  },
  docLineLong: {
    height: 3,
    backgroundColor: Colors.softBlue,
    borderRadius: 1.5,
  },
  docLineShort: {
    height: 3,
    width: '60%',
    backgroundColor: Colors.softBlue,
    borderRadius: 1.5,
  },
  shield: {
    position: 'absolute',
    bottom: -5,
    right: 10,
    width: 28,
    height: 32,
    backgroundColor: Colors.primaryBlue,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  shieldCheck: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
});
