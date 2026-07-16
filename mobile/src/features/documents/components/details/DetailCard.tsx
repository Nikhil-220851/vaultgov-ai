import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface DetailRow {
  label: string;
  value: string;
}

interface DetailCardProps {
  rows: DetailRow[];
}

/** Information card rendering a set of label/value rows. */
export const DetailCard = memo<DetailCardProps>(({ rows }) => (
  <View style={styles.card}>
    {rows.map((row, idx) => (
      <View
        key={row.label}
        style={[styles.row, idx < rows.length - 1 && styles.rowBorder]}
      >
        <Text style={styles.label}>{row.label}</Text>
        <Text style={styles.value} numberOfLines={2}>
          {row.value}
        </Text>
      </View>
    ))}
  </View>
));

DetailCard.displayName = 'DetailCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
  },
  value: {
    flex: 2,
    fontSize: Typography.sizes.sm,
    color: Colors.pureBlack,
    fontWeight: Typography.weights.medium,
    fontFamily: Typography.fontFamilies.sans,
    textAlign: 'right',
  },
});
