"use no memo";
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface DocumentHealthCardProps {
  score: number;
  total: number;
  expired: number;
  expiringSoon: number;
  verified: number;
}

export function DocumentHealthCard({
  score,
  total,
  expired,
  expiringSoon,
  verified,
}: DocumentHealthCardProps) {
  const pct = Math.round((score / total) * 100);
  const scoreColor =
    pct >= 80
      ? Colors.primaryGreen
      : pct >= 50
      ? Colors.primaryOrange
      : Colors.dangerRed;

  const suggestions = [
    expired > 0 && `Renew ${expired} expired document${expired > 1 ? 's' : ''}`,
    expiringSoon > 0 && `${expiringSoon} document${expiringSoon > 1 ? 's' : ''} expiring soon`,
    verified < 5 && 'Link more verified services to boost score',
  ].filter(Boolean) as string[];

  return (
    <View style={styles.container}>
      {/* Score Row */}
      <View style={styles.scoreRow}>
        {/* Circular Progress */}
        <View style={styles.circleWrap}>
          <View style={[styles.circleTrack, { borderColor: '#EAEAEA' }]}>
            <View style={[styles.circleFill, { borderColor: scoreColor }]} />
            <View style={styles.circleInner}>
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>{pct}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsBlock}>
          <StatRow icon="checkmark-circle-outline" label="Verified" value={verified} color={Colors.primaryGreen} />
          <StatRow icon="alert-circle-outline" label="Expiring Soon" value={expiringSoon} color={Colors.primaryOrange} />
          <StatRow icon="close-circle-outline" label="Expired" value={expired} color={Colors.dangerRed} />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: scoreColor }]} />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressMin}>0</Text>
        <Text style={[styles.progressScore, { color: scoreColor }]}>{pct} / 100</Text>
        <Text style={styles.progressMax}>100</Text>
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>Improve your score</Text>
          {suggestions.map((s, i) => (
            <View key={i} style={styles.suggestionRow}>
              <Ionicons name="arrow-up-circle-outline" size={14} color={Colors.primaryBlue} />
              <Text style={styles.suggestionText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function StatRow({ icon, label, value, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statRow}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.lg,
  },
  circleWrap: {
    width: 90,
    height: 90,
  },
  circleTrack: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleFill: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 7,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  circleInner: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    lineHeight: 26,
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.darkGray,
  },
  statsBlock: {
    flex: 1,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  statValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#EAEAEA',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  progressMin: {
    fontSize: 10,
    color: Colors.darkGray,
  },
  progressScore: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  progressMax: {
    fontSize: 10,
    color: Colors.darkGray,
  },
  suggestions: {
    backgroundColor: '#F5F8FF',
    borderRadius: Radius.sm,
    padding: 12,
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  suggestionText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.pureBlack,
    lineHeight: 18,
  },
});
