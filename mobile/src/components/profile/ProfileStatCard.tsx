"use no memo";
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface ProfileStatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

export function ProfileStatCard({ icon, label, value, color, suffix = '', emptyStateText }: ProfileStatCardProps & { emptyStateText?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(10));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    if (value === 0 && emptyStateText) {
      setDisplayed(0);
      return;
    }

    // Animated counter
    let start: number | null = null;
    const duration = 800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayed(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, opacity, translateY, emptyStateText]);

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      {value === 0 && emptyStateText ? (
        <Text style={styles.emptyText}>{emptyStateText}</Text>
      ) : (
        <Text style={styles.value}>
          {displayed}{suffix}
        </Text>
      )}
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginBottom: 2,
    textAlign: 'center',
    minHeight: 26,
    textAlignVertical: 'center',
  },
  label: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    textAlign: 'center',
  },
});
