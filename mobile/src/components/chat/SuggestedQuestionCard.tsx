"use no memo";
import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface SuggestedQuestionCardProps {
  question: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export function SuggestedQuestionCard({ question, icon, onPress }: SuggestedQuestionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.leftRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={16} color={Colors.primaryBlue} />
        </View>
        <Text style={styles.text} numberOfLines={2}>
          {question}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.darkGray} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginBottom: Spacing.sm,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
    flex: 1,
  },
});
