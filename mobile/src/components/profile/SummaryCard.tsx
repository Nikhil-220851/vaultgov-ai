"use no memo";
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProfileStatCard } from './ProfileStatCard';
import { Spacing } from '@/theme';

interface SummaryCardProps {
  documentsStored: number;
  savedSchemes: number;
  expiringSoon: number;
  memberSinceYear: number;
}

export function SummaryCard({
  documentsStored,
  savedSchemes,
  expiringSoon,
  memberSinceYear,
}: SummaryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ProfileStatCard
          icon="document-text-outline"
          label="Documents Stored"
          value={documentsStored}
          color="#1977F3"
          emptyStateText="No documents yet"
        />
        <View style={styles.gap} />
        <ProfileStatCard
          icon="bookmark-outline"
          label="Saved Schemes"
          value={savedSchemes}
          color="#FF9800"
          emptyStateText="No saved schemes"
        />
      </View>
      <View style={styles.rowGap} />
      <View style={styles.row}>
        <ProfileStatCard
          icon="time-outline"
          label="Expiring Soon"
          value={expiringSoon}
          color="#FF3B30"
          emptyStateText="None"
        />
        <View style={styles.gap} />
        <ProfileStatCard
          icon="calendar-outline"
          label="Member Since"
          value={memberSinceYear}
          color="#3CC556"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gap: {
    width: Spacing.md,
  },
  rowGap: {
    height: Spacing.md,
  },
});
