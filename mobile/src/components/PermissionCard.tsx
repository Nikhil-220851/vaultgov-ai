import React from 'react';
import { StyleSheet, Text, View, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface PermissionCardProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function PermissionCard({
  iconName,
  title,
  description,
  value,
  onValueChange,
}: PermissionCardProps) {
  return (
    <View style={styles.cardContainer}>
      {/* Left Icon Container */}
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={22} color={colors.primary} />
      </View>

      {/* Middle Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* Right Toggle Switch */}
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E5EA', true: colors.primary }}
        thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
        ios_backgroundColor="#E5E5EA"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F4FA', // light blue tint matching primary
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 18,
  },
});
