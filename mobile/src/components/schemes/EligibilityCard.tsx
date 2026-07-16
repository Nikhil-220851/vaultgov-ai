import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EligibilityCriterion, EligibilityStatus } from '@/data/schemes';
import { colors } from '@/theme/colors';
import { Colors, Radius, Spacing, Typography } from '@/theme';

interface EligibilityCardProps {
  status: EligibilityStatus;
  criteria: EligibilityCriterion[];
  eligibilityPercentage: number;
}

const STATUS_CONFIG: Record<EligibilityStatus, { label: string; sublabel: string; color: string; bgColor: string; iconName: 'checkmark-circle' | 'alert-circle' | 'close-circle' }> = {
  highly_recommended: {
    label: 'Likely Eligible',
    sublabel: 'You are an excellent match for this scheme.',
    color: '#1B8A3E',
    bgColor: '#E6F5EC',
    iconName: 'checkmark-circle' as const,
  },
  eligible: {
    label: 'Potential Match',
    sublabel: 'You meet the eligibility criteria for this scheme.',
    color: '#3CC556',
    bgColor: '#EDFBF0',
    iconName: 'checkmark-circle' as const,
  },
  partially_eligible: {
    label: 'Partial Match',
    sublabel: 'You meet some criteria. Review the details below.',
    color: '#FF9800',
    bgColor: '#FFF7EC',
    iconName: 'alert-circle' as const,
  },
  not_eligible: {
    label: 'Unlikely Match',
    sublabel: 'You do not currently meet the eligibility criteria.',
    color: '#FF3B30',
    bgColor: '#FFF1F0',
    iconName: 'close-circle' as const,
  },
};

export function EligibilityCard({
  status,
  criteria,
  eligibilityPercentage,
}: EligibilityCardProps) {
  const config = STATUS_CONFIG[status];
  const passedCount = criteria.filter((c) => c.passed).length;

  return (
    <View style={styles.container}>
      {/* Overall Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: config.bgColor }]}>
        <View style={[styles.statusIconWrap, { backgroundColor: config.color + '22' }]}>
          <Ionicons name={config.iconName} size={28} color={config.color} />
        </View>
        <View style={styles.statusTextBlock}>
          <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.statusSublabel}>{config.sublabel}</Text>
        </View>
        <View style={[styles.pctBadge, { backgroundColor: config.color + '22' }]}>
          <Text style={[styles.pctText, { color: config.color }]}>{eligibilityPercentage}%</Text>
        </View>
      </View>

      {/* Criteria Count */}
      <View style={styles.criteriaHeader}>
        <Text style={styles.criteriaTitle}>Eligibility Criteria</Text>
        <Text style={styles.criteriaCount}>
          {passedCount} of {criteria.length} met
        </Text>
      </View>

      {/* Criteria List */}
      <View style={styles.criteriaList}>
        {criteria.map((criterion, index) => (
          <View
            key={criterion.id}
            style={[
              styles.criterionCard,
              criterion.passed ? styles.criterionPassed : styles.criterionFailed,
              index < criteria.length - 1 && styles.criterionCardGap,
            ]}
          >
            {/* Icon */}
            <View
              style={[
                styles.criterionIcon,
                { backgroundColor: criterion.passed ? '#EDFBF0' : '#FFF1F0' },
              ]}
            >
              <Ionicons
                name={criterion.passed ? 'checkmark' : 'close'}
                size={14}
                color={criterion.passed ? '#3CC556' : '#FF3B30'}
              />
            </View>

            {/* Text */}
            <View style={styles.criterionContent}>
              <Text style={styles.criterionLabel}>{criterion.label}</Text>
              <View style={styles.criterionDetails}>
                <View style={styles.criterionDetailRow}>
                  <Text style={styles.criterionDetailKey}>Required: </Text>
                  <Text style={styles.criterionDetailValue}>{criterion.required}</Text>
                </View>
                <View style={styles.criterionDetailRow}>
                  <Text style={styles.criterionDetailKey}>Your value: </Text>
                  <Text
                    style={[
                      styles.criterionDetailValue,
                      { color: criterion.passed ? '#3CC556' : '#FF3B30' },
                    ]}
                  >
                    {criterion.userValue}
                  </Text>
                </View>
              </View>
              {!criterion.passed && criterion.reason && (
                <View style={styles.reasonBox}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={12}
                    color="#FF3B30"
                    style={styles.reasonIcon}
                  />
                  <Text style={styles.reasonText}>{criterion.reason}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Note */}
      <View style={styles.noteBox}>
        <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#FF9800" style={{ marginTop: 2 }} />
        <Text style={styles.noteText}>
          Final eligibility is determined by the official Government authority. Please verify the complete eligibility criteria on the official website before applying.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  statusTextBlock: {
    flex: 1,
  },
  statusLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginBottom: 4,
  },
  statusSublabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    lineHeight: 16,
  },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    marginLeft: 8,
  },
  pctText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  criteriaTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: colors.black,
  },
  criteriaCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  criteriaList: {
    gap: 0,
  },
  criterionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  criterionCardGap: {
    marginBottom: Spacing.sm,
  },
  criterionPassed: {
    backgroundColor: '#FAFFFE',
    borderColor: '#3CC55622',
  },
  criterionFailed: {
    backgroundColor: '#FFFAFA',
    borderColor: '#FF3B3022',
  },
  criterionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    flexShrink: 0,
  },
  criterionContent: {
    flex: 1,
  },
  criterionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: colors.black,
    marginBottom: 6,
  },
  criterionDetails: {
    gap: 2,
  },
  criterionDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  criterionDetailKey: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  criterionDetailValue: {
    fontSize: Typography.sizes.xs,
    color: colors.black,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF1F0',
    borderRadius: Radius.xs,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  reasonIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  reasonText: {
    fontSize: Typography.sizes.xs,
    color: '#FF3B30',
    lineHeight: 16,
    flex: 1,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F7',
    borderRadius: Radius.sm,
    padding: 12,
    marginTop: Spacing.md,
    gap: 8,
  },
  noteText: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    lineHeight: 16,
    flex: 1,
  },
});
