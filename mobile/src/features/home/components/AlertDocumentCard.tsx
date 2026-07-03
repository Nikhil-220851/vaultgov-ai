import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors, Radius, Typography, Spacing } from '@/theme';
import { AlertItem } from '../types';

interface AlertDocumentCardProps {
  item: AlertItem;
  onPress?: () => void;
}

export const AlertDocumentCard: React.FC<AlertDocumentCardProps> = ({ item, onPress }) => {
  return (
    <AnimatedPressable
      accessibilityLabel={`Attention needed: ${item.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, { borderColor: item.borderColor, backgroundColor: item.borderColor + '15' }]} // 15 is hex opacity
    >
      <View style={[styles.iconContainer, { backgroundColor: item.borderColor + '25' }]}>
        <Ionicons name={item.iconName as any} size={22} color={item.accentColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.expiry}>{item.expiryInfo}</Text>
      </View>
      <View style={[styles.badge, { borderColor: item.accentColor, backgroundColor: item.accentColor + '10' }]}>
        <Text style={[styles.badgeText, { color: item.accentColor }]}>{item.badgeText}</Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
    fontFamily: Typography.fontFamilies.heading,
  },
  expiry: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.sans,
  },
});

export default AlertDocumentCard;
