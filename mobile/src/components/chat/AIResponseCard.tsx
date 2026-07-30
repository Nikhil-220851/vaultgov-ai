"use no memo";
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

export interface AICardData {
  type: 'scheme' | 'document' | 'application' | 'health';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  details?: { label: string; value: string; color?: string }[];
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  iconName?: string;
  iconFamily?: 'ionicons' | 'material-community';
}

interface AIResponseCardProps {
  data: AICardData;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

export function AIResponseCard(props: AIResponseCardProps) {
  console.log("AIResponseCard props:", props);
  const { data, onPrimaryAction, onSecondaryAction } = props;
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const renderIcon = () => {
    const family = data.iconFamily || 'ionicons';
    const name = data.iconName || 'sparkles';
    const color = Colors.primaryBlue;

    if (family === 'material-community') {
      return <MaterialCommunityIcons name={name as any} size={20} color={color} />;
    }
    return <Ionicons name={name as any} size={20} color={color} />;
  };

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      {/* Header section */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            {renderIcon()}
          </View>
          <View style={styles.titleTexts}>
            <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
            {data.subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>{data.subtitle}</Text>
            ) : null}
          </View>
        </View>
        {data.badge ? (
          <View style={[styles.badge, { backgroundColor: (data.badgeColor || Colors.primaryBlue) + '15' }]}>
            <Text style={[styles.badgeText, { color: data.badgeColor || Colors.primaryBlue }]}>
              {data.badge}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Details list */}
      {data.details && data.details.length > 0 && (
        <View style={styles.detailsContainer}>
          {data.details.map((item, index) => (
            <View key={index} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={[styles.detailValue, item.color ? { color: item.color } : null]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action buttons */}
      {(data.primaryActionLabel || data.secondaryActionLabel) && (
        <View style={styles.actions}>
          {data.secondaryActionLabel && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onSecondaryAction}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>{data.secondaryActionLabel}</Text>
            </TouchableOpacity>
          )}
          {data.primaryActionLabel && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onPrimaryAction}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{data.primaryActionLabel}</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTexts: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
  },
  detailsContainer: {
    backgroundColor: '#F7F8F5',
    borderRadius: Radius.sm,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  detailValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.button - 2,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: Typography.weights.semibold,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.button - 2,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
  },
});
