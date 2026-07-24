import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors } from '@/theme';
import { VaultGovDocument } from '@/services/api';
import { styles } from '../documents.styles';

interface DocumentCardProps {
  item: VaultGovDocument;
  onPress?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ item, onPress }) => {
  // Phase 5 Smart Vault Engine: Determine color scheme based on document status
  const getCardStyles = () => {
    const status = item.status;
    if (status === 'ACTIVE') {
      return {
        cardBg: Colors.white,
        cardBorder: '#E6E6E6',
        iconBg: '#E8F5E9',
        iconColor: '#2E7D32', // Green
        badgeBg: '#E8F5E9',
        badgeText: '#2E7D32',
        badgeBorder: '#A5D6A7',
        badgeLabel: '🟢 Active'
      };
    } else if (status === 'EXPIRING_SOON') {
      return {
        cardBg: Colors.white,
        cardBorder: '#E6E6E6',
        iconBg: '#FFF8E1',
        iconColor: '#F57F17', // Yellow/Orange
        badgeBg: '#FFF8E1',
        badgeText: '#F57F17',
        badgeBorder: '#FFE082',
        badgeLabel: '🟡 Expiring Soon'
      };
    } else if (status === 'EXPIRED') {
      return {
        cardBg: Colors.white,
        cardBorder: '#E6E6E6',
        iconBg: '#FFEBEE',
        iconColor: '#C62828', // Red
        badgeBg: '#FFEBEE',
        badgeText: '#C62828',
        badgeBorder: '#EF9A9A',
        badgeLabel: '🔴 Expired'
      };
    } else {
      // NO_EXPIRY or INVALID_DATE
      return {
        cardBg: Colors.white,
        cardBorder: '#E6E6E6',
        iconBg: '#F2F2F2',
        iconColor: Colors.darkGray,
        badgeBg: '#F2F2F2',
        badgeText: Colors.darkGray,
        badgeBorder: '#C0C0C0',
        badgeLabel: '⚪ No Expiry'
      };
    }
  };

  const cardStyles = getCardStyles();

  return (
    <AnimatedPressable
      accessibilityLabel={`Document: ${item.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: cardStyles.cardBg,
          borderColor: cardStyles.cardBorder,
        },
      ]}
    >
      <View style={[styles.cardIconContainer, { backgroundColor: cardStyles.iconBg }]}>
        <Ionicons name="document-text-outline" size={22} color={cardStyles.iconColor} />
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.category || 'Uncategorised'} • {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>

      <View
        style={[
          styles.badge,
          {
            backgroundColor: cardStyles.badgeBg,
            borderColor: cardStyles.badgeBorder,
          },
        ]}
      >
        <Text style={[styles.badgeText, { color: cardStyles.badgeText }]}>
          {cardStyles.badgeLabel}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

export default DocumentCard;
