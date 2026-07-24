/**
 * RecentDocumentCard.tsx
 *
 * A compact, tappable card for recent documents shown on the Home screen.
 * Tapping navigates to the Document Details screen via Expo Router.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { VaultGovDocument } from '@/services/api';

interface RecentDocumentCardProps {
  item: VaultGovDocument;
  onPress: () => void;
}

export const RecentDocumentCard = memo<RecentDocumentCardProps>(({ item, onPress }) => {
  // Derive a short date string e.g. "12 Jul"
  const shortDate = new Date(item.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  // Phase 5 Smart Vault Engine: Status dot colour
  const status = (item as any).status; // Cast to any since VaultGovDocument types might take a moment to propagate
  let dotColor = '#BDBDBD'; // Default / NO_EXPIRY
  if (status === 'ACTIVE') dotColor = '#43A047'; // Green
  else if (status === 'EXPIRING_SOON') dotColor = '#FB8C00'; // Orange
  else if (status === 'EXPIRED') dotColor = '#E53935'; // Red

  return (
    <AnimatedPressable
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`Open document: ${item.title}`}
      accessibilityRole="button"
    >
      {/* Icon */}
      <View style={styles.iconWrap}>
        <Ionicons name="document-text-outline" size={20} color={Colors.primaryBlue} />
      </View>

      {/* Text */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.category || 'Uncategorised'} · {shortDate}
        </Text>
      </View>

      {/* Confidence dot + chevron */}
      <View style={styles.right}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Ionicons name="chevron-forward" size={16} color="#C0C0C0" style={{ marginLeft: 6 }} />
      </View>
    </AnimatedPressable>
  );
});

RecentDocumentCard.displayName = 'RecentDocumentCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.pureBlack,
  },
  sub: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
