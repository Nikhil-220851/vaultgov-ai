import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors, Radius, Typography, Spacing } from '@/theme';
import { OverviewItem } from '../types';

interface OverviewCardProps {
  item: OverviewItem;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({ item, isFirst, isLast, onPress }) => {
  // Determine color theme based on item type
  const getColors = () => {
    switch (item.type) {
      case 'warning':
        return {
          bg: '#FFF9F2',
          border: '#FFE0B2',
          borderStyle: 'dashed' as const,
          text: Colors.primaryOrange,
          icon: Colors.primaryOrange,
        };
      case 'success':
        return {
          bg: '#F2FCF4',
          border: '#E2F6E7',
          borderStyle: 'dashed' as const,
          text: Colors.primaryGreen,
          icon: Colors.primaryGreen,
        };
      case 'neutral':
      default:
        return {
          bg: Colors.white,
          border: '#E6E6E6',
          borderStyle: 'dashed' as const,
          text: Colors.pureBlack,
          icon: Colors.darkGray,
        };
    }
  };

  const cardColors = getColors();

  return (
    <AnimatedPressable
      accessibilityLabel={`Overview ${item.label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: cardColors.bg,
          borderColor: cardColors.border,
          borderStyle: cardColors.borderStyle,
        },
        isFirst && styles.cardFirst,
        isLast && styles.cardLast,
      ]}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={item.iconName as any} size={22} color={cardColors.icon} />
      </View>
      <Text style={[styles.cardCount, { color: cardColors.text }]}>{item.count}</Text>
      <Text style={[styles.cardLabel, { color: cardColors.icon }]}>{item.label}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  cardFirst: {
    marginLeft: 0,
  },
  cardLast: {
    marginRight: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardCount: {
    fontSize: 28,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
  },
  cardLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 2,
  },
});

export default OverviewCard;
