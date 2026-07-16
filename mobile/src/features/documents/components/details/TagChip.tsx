import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface TagChipProps {
  label: string;
}

/** A single rounded tag chip. */
export const TagChip = memo<TagChipProps>(({ label }) => (
  <View style={styles.chip}>
    <Text style={styles.label} numberOfLines={1}>
      {label}
    </Text>
  </View>
));

TagChip.displayName = 'TagChip';

interface TagChipRowProps {
  tags: string[];
}

/** Renders a wrapping row of TagChip components. */
export const TagChipRow = memo<TagChipRowProps>(({ tags }) => {
  if (!tags || tags.length === 0) {
    return (
      <Text style={styles.emptyText}>No tags</Text>
    );
  }

  return (
    <View style={styles.row}>
      {tags.map((tag) => (
        <TagChip key={tag} label={tag} />
      ))}
    </View>
  );
});

TagChipRow.displayName = 'TagChipRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    backgroundColor: '#EEF2FF',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: '#3730A3',
    fontFamily: Typography.fontFamilies.sans,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontStyle: 'italic',
  },
});
