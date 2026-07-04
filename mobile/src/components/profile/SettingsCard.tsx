"use no memo";
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface SettingsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  destructive?: boolean;
}

export function SettingsCard({
  icon,
  iconColor,
  iconBg,
  label,
  description,
  badge,
  badgeColor,
  rightElement,
  onPress,
  isLast,
  destructive,
}: SettingsCardProps) {
  const resolvedIconColor = iconColor ?? (destructive ? Colors.dangerRed : Colors.primaryBlue);
  const resolvedIconBg = iconBg ?? (destructive ? '#FFF0EF' : '#EBF2FF');

  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: resolvedIconBg }]}>
        <Ionicons name={icon} size={18} color={resolvedIconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, destructive && styles.labelDestructive]}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={styles.right}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: (badgeColor ?? Colors.primaryBlue) + '18' }]}>
            <Text style={[styles.badgeText, { color: badgeColor ?? Colors.primaryBlue }]}>{badge}</Text>
          </View>
        ) : null}
        {rightElement ?? (
          <Ionicons name="chevron-forward" size={16} color={Colors.darkGray} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
    marginBottom: 1,
  },
  labelDestructive: {
    color: Colors.dangerRed,
  },
  description: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
});
