import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/theme';

interface ConfidenceBadgeProps {
  /** 0–100 confidence score, or null if unavailable. */
  score: number | null;
}

/** Returns tier config based on numeric score. */
function getTier(score: number): { label: string; bg: string; text: string; border: string } {
  if (score >= 95) {
    return { label: 'Excellent', bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
  }
  if (score >= 75) {
    return { label: 'Good', bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' };
  }
  return { label: 'Low', bg: '#FFEBEE', text: '#C62828', border: '#EF9A9A' };
}

export const ConfidenceBadge = memo<ConfidenceBadgeProps>(({ score }) => {
  if (score === null || score === undefined) {
    return (
      <View style={[styles.badge, { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }]}>
        <Text style={[styles.score, { color: '#9E9E9E' }]}>–</Text>
        <Text style={[styles.label, { color: '#9E9E9E' }]}>No Score</Text>
      </View>
    );
  }

  const tier = getTier(score);

  return (
    <View style={[styles.badge, { backgroundColor: tier.bg, borderColor: tier.border }]}>
      <Text style={[styles.score, { color: tier.text }]}>{Math.round(score)}%</Text>
      <Text style={[styles.label, { color: tier.text }]}>{tier.label}</Text>
    </View>
  );
});

ConfidenceBadge.displayName = 'ConfidenceBadge';

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  score: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    lineHeight: Typography.lineHeights.xl,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
});
