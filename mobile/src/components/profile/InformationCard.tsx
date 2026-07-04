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

interface InformationCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isVerified?: boolean;
  isMasked?: boolean;
  onPress?: () => void;
}

export function InformationCard({
  icon,
  label,
  value,
  isVerified,
  onPress,
}: InformationCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.82 : 1}
      disabled={!onPress}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={Colors.primaryBlue} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
      </View>
      <View style={styles.right}>
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.primaryGreen} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color={Colors.darkGray} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginBottom: 3,
  },
  value: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: Spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDFBF0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryGreen,
  },
});
