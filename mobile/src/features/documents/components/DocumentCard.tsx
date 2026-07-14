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
  // Determine color scheme based on document state
  const getCardStyles = () => {
    // For Phase 3A, all docs are neutral until we have a real expiration system
    return {
      cardBg: Colors.white,
      cardBorder: '#E6E6E6',
      iconBg: '#F2F2F2',
      iconColor: Colors.darkGray,
      badgeBg: '#F2F2F2',
      badgeText: Colors.darkGray,
      badgeBorder: '#C0C0C0',
    };
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
          {item.source === 'camera' ? 'Scanned' : 'Uploaded'}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

export default DocumentCard;
