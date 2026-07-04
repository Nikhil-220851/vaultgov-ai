import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Scheme } from '@/data/schemes';
import { colors } from '@/theme/colors';
import { Colors, Radius, Spacing, Typography } from '@/theme';

interface SchemeCardProps {
  scheme: Scheme;
  onPress: (scheme: Scheme) => void;
  onBookmark?: (schemeId: string) => void;
  isSaved?: boolean;
}

export function SchemeCard({ scheme, onPress, onBookmark, isSaved = false }: SchemeCardProps) {
  const missingDocs = scheme.requiredDocuments.filter((d) => d.status === 'missing').length;
  const totalDocs = scheme.requiredDocuments.length;
  const docsReady = totalDocs - missingDocs;

  const eligibilityColor =
    scheme.eligibilityStatus === 'eligible'
      ? '#3CC556'
      : scheme.eligibilityStatus === 'partially_eligible'
      ? '#FF9800'
      : '#FF3B30';

  const eligibilityLabel =
    scheme.eligibilityStatus === 'eligible'
      ? 'Eligible'
      : scheme.eligibilityStatus === 'partially_eligible'
      ? 'Partial Match'
      : 'Not Eligible';

  return (
    <AnimatedPressable onPress={() => onPress(scheme)} style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: scheme.accentColor + '18' }]}>
          <MaterialCommunityIcons
            name={scheme.iconName as any}
            size={26}
            color={scheme.accentColor}
          />
        </View>

        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {scheme.shortTitle}
          </Text>
          <Text style={styles.department} numberOfLines={1}>
            {scheme.ministry}
          </Text>
        </View>

        {/* Bookmark */}
        {onBookmark && (
          <Pressable
            onPress={() => onBookmark(scheme.id)}
            style={styles.bookmarkBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? colors.primary : Colors.darkGray}
            />
          </Pressable>
        )}
      </View>

      {/* Badges Row */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{scheme.category}</Text>
        </View>
        <View style={[styles.badge, styles.typeBadge]}>
          <Text style={[styles.badgeText, styles.typeBadgeText]}>{scheme.type}</Text>
        </View>
        {scheme.renewable && (
          <View style={[styles.badge, styles.renewableBadge]}>
            <MaterialCommunityIcons name="refresh" size={10} color="#3CC556" />
            <Text style={[styles.badgeText, styles.renewableText]}> Renewable</Text>
          </View>
        )}
      </View>

      {/* Eligibility Bar */}
      <View style={styles.eligibilitySection}>
        <View style={styles.eligibilityLabelRow}>
          <Text style={styles.eligibilityLabel}>Match Score</Text>
          <View style={[styles.eligibilityPill, { backgroundColor: eligibilityColor + '1A' }]}>
            <View style={[styles.eligibilityDot, { backgroundColor: eligibilityColor }]} />
            <Text style={[styles.eligibilityPillText, { color: eligibilityColor }]}>
              {eligibilityLabel}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${scheme.eligibilityPercentage}%`,
                backgroundColor: eligibilityColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressPct}>{scheme.eligibilityPercentage}% match</Text>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={13} color={Colors.darkGray} />
          <Text style={styles.infoText} numberOfLines={1}>
            {scheme.deadline}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="document-text-outline" size={13} color={Colors.darkGray} />
          <Text style={styles.infoText}>
            {docsReady}/{totalDocs} docs ready
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cash-outline" size={13} color={Colors.darkGray} />
          <Text style={styles.infoText}>
            {scheme.applicationFee === 0 ? 'Free' : `₹${scheme.applicationFee}`}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Assistance & CTA */}
      <View style={styles.footer}>
        <View style={styles.assistanceBlock}>
          <Text style={styles.assistanceLabel}>Financial Assistance</Text>
          <Text style={styles.assistanceValue} numberOfLines={1}>
            {scheme.financialAssistance}
          </Text>
        </View>
        <View
          style={[
            styles.applyBtn,
            scheme.eligibilityStatus === 'not_eligible' && styles.applyBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.applyText,
              scheme.eligibilityStatus === 'not_eligible' && styles.applyTextDisabled,
            ]}
          >
            {scheme.eligibilityStatus === 'not_eligible' ? 'View Details' : 'Apply Now'}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={14}
            color={scheme.eligibilityStatus === 'not_eligible' ? Colors.darkGray : colors.white}
          />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: colors.black,
    lineHeight: 22,
    marginBottom: 3,
  },
  department: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    lineHeight: 16,
  },
  bookmarkBtn: {
    paddingTop: 2,
    paddingLeft: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#F5F5F7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
  },
  typeBadge: {
    backgroundColor: '#EBF2FF',
  },
  typeBadgeText: {
    color: colors.primary,
  },
  renewableBadge: {
    backgroundColor: '#EDFBF0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  renewableText: {
    color: '#3CC556',
    fontSize: 11,
  },
  eligibilitySection: {
    marginBottom: 14,
  },
  eligibilityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eligibilityLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
  },
  eligibilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  eligibilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  eligibilityPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  progressPct: {
    fontSize: 11,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assistanceBlock: {
    flex: 1,
    marginRight: 12,
  },
  assistanceLabel: {
    fontSize: 11,
    color: Colors.darkGray,
    marginBottom: 2,
  },
  assistanceValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: colors.black,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.button,
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  applyBtnDisabled: {
    backgroundColor: '#F5F5F7',
    shadowColor: 'transparent',
    elevation: 0,
  },
  applyText: {
    fontSize: 13,
    fontWeight: Typography.weights.semibold,
    color: colors.white,
  },
  applyTextDisabled: {
    color: Colors.darkGray,
  },
});
