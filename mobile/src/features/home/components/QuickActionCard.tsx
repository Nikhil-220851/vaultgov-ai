import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors } from '@/theme';
import { styles } from '../styles';
import { QuickActionItem } from '../types';

interface QuickActionCardProps {
  item: QuickActionItem;
  onPress?: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ item, onPress }) => {
  return (
    <AnimatedPressable
      accessibilityLabel={`Quick action: ${item.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.quickActionCard}
    >
      <View style={styles.quickActionIconContainer}>
        <Ionicons name={item.iconName as any} size={22} color={Colors.primaryBlue} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{item.title}</Text>
        <Text style={styles.quickActionSubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.chevronContainer}>
        <Ionicons name="arrow-forward" size={20} color={Colors.primaryBlue} />
      </View>
    </AnimatedPressable>
  );
};

export default QuickActionCard;
