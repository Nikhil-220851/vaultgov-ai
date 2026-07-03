import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors } from '@/theme';
import { DocumentItem } from '../documents.types';
import { styles } from '../documents.styles';

interface DocumentCardProps {
  item: DocumentItem;
  onPress?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ item, onPress }) => {
  // Determine color scheme based on document state
  const getCardStyles = () => {
    switch (item.state) {
      case 'danger':
        // Use softPink as a visible tinted background; dangerRed for border and accents
        return {
          cardBg: Colors.softPink,           // #F1D0D0 — clearly visible pink tint
          cardBorder: Colors.dangerRed,       // #FF3B30 — strong red border
          iconBg: '#F9E0E0',                  // slightly lighter pink for icon well
          iconColor: Colors.dangerRed,
          badgeBg: '#FDECEA',                 // very soft red for badge fill
          badgeText: Colors.dangerRed,
          badgeBorder: Colors.dangerRed,
        };
      case 'warning':
        // Soft warm-yellow tint background; orange border and accents
        return {
          cardBg: '#FFF3E0',                  // soft warm-orange background
          cardBorder: Colors.primaryOrange,   // #FF9800 — visible orange border
          iconBg: '#FFE0B2',                  // deeper orange tint for icon well
          iconColor: Colors.primaryOrange,
          badgeBg: '#FFF3E0',                 // matching soft orange badge fill
          badgeText: Colors.primaryOrange,
          badgeBorder: Colors.primaryOrange,
        };
      case 'success':
        return {
          cardBg: Colors.white,
          cardBorder: '#E6E6E6',
          iconBg: '#F2F2F2',
          iconColor: Colors.darkGray,
          badgeBg: '#EBF9EF',
          badgeText: Colors.primaryGreen,
          badgeBorder: Colors.primaryGreen,
        };
      case 'info':
        return {
          cardBg: Colors.white,
          cardBorder: '#E6E6E6',
          iconBg: '#F2F2F2',
          iconColor: Colors.darkGray,
          badgeBg: Colors.softBlue,           // #C9D2F0 — existing soft blue token
          badgeText: Colors.primaryBlue,
          badgeBorder: Colors.primaryBlue,
        };
      case 'neutral':
      default:
        return {
          cardBg: Colors.white,
          cardBorder: '#E6E6E6',
          iconBg: '#F2F2F2',
          iconColor: Colors.darkGray,
          badgeBg: '#F2F2F2',
          badgeText: Colors.darkGray,
          badgeBorder: '#C0C0C0',
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
        <Ionicons name={item.iconName as any} size={22} color={cardStyles.iconColor} />
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
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
          {item.expiryText}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

export default DocumentCard;
