"use no memo";
import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface QuickChipProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
}

export function QuickChip({ label, onPress, selected = false }: QuickChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
  },
  text: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  textSelected: {
    color: '#FFFFFF',
  },
  textUnselected: {
    color: Colors.darkGray,
  },
});
