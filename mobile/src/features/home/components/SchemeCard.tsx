import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors } from '@/theme';
import { styles } from '../styles';
import { SchemeItem } from '../types';

interface SchemeCardProps {
  item: SchemeItem;
  onPress?: () => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ item, onPress }) => {
  return (
    <AnimatedPressable
      accessibilityLabel={`Eligible scheme: ${item.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.schemeCard}
    >
      <View style={styles.schemeIconContainer}>
        <Ionicons name={item.iconName as any} size={22} color={Colors.primaryGreen} />
      </View>
      <View style={styles.schemeContent}>
        <Text style={styles.schemeTitle}>{item.title}</Text>
        <Text style={styles.schemeDescription}>{item.description}</Text>
      </View>
      <View style={styles.schemeBadge}>
        <Text style={styles.schemeBadgeText}>{item.badgeText}</Text>
      </View>
    </AnimatedPressable>
  );
};

export default SchemeCard;
