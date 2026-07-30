import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Typography, Colors } from '@/theme';

interface SectionTitleProps {
  title: string;
  style?: TextStyle;
}

export function SectionTitle({ title, style }: SectionTitleProps) {
  return (
    <Text style={[styles.title, style]}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.darkGray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
