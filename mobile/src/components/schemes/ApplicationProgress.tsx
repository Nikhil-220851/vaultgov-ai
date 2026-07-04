import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApplicationStatus, getApplicationStatusColor, getApplicationStatusLabel } from '@/data/schemes';
import { colors } from '@/theme/colors';
import { Colors, Spacing, Typography } from '@/theme';

const STEPS: { status: ApplicationStatus; label: string; sublabel: string }[] = [
  {
    status: 'submitted',
    label: 'Application Submitted',
    sublabel: 'Your application has been received',
  },
  {
    status: 'under_review',
    label: 'Document Verification',
    sublabel: 'Documents are being verified',
  },
  {
    status: 'documents_requested',
    label: 'Department Review',
    sublabel: 'Under review by the department',
  },
  {
    status: 'approved',
    label: 'Final Decision',
    sublabel: 'Approval or rejection issued',
  },
];

const STATUS_ORDER: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'documents_requested',
  'approved',
];

interface ApplicationProgressProps {
  currentStatus: ApplicationStatus;
  submittedAt: string;
  applicationId: string;
}

export function ApplicationProgress({
  currentStatus,
  submittedAt,
  applicationId,
}: ApplicationProgressProps) {
  const currentIndex =
    currentStatus === 'rejected'
      ? STATUS_ORDER.indexOf('documents_requested')
      : STATUS_ORDER.indexOf(currentStatus);

  const statusColor = getApplicationStatusColor(currentStatus);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appId}>{applicationId}</Text>
          <Text style={styles.submittedAt}>Submitted: {submittedAt}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {getApplicationStatusLabel(currentStatus)}
          </Text>
        </View>
      </View>

      {/* Rejected notice */}
      {currentStatus === 'rejected' && (
        <View style={styles.rejectedBox}>
          <Ionicons name="close-circle" size={14} color="#FF3B30" />
          <Text style={styles.rejectedText}>
            This application was rejected. You may re-apply after addressing the issues.
          </Text>
        </View>
      )}

      {/* Step Tracker */}
      <View style={styles.tracker}>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isRejectedHere = currentStatus === 'rejected' && index === currentIndex;
          const isPending = index > currentIndex;

          const circleColor = isRejectedHere
            ? '#FF3B30'
            : isCompleted
            ? '#3CC556'
            : isCurrent
            ? colors.primary
            : '#E5E5EA';

          const lineColor = isCompleted ? '#3CC556' : '#E5E5EA';

          return (
            <View key={step.status} style={styles.stepRow}>
              {/* Connector line (above) */}
              {index > 0 && (
                <View style={styles.lineContainer}>
                  <View style={[styles.line, { backgroundColor: lineColor }]} />
                </View>
              )}

              <View style={styles.stepContent}>
                {/* Circle */}
                <View style={[styles.circle, { backgroundColor: circleColor + '20', borderColor: circleColor }]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color="#3CC556" />
                  ) : isRejectedHere ? (
                    <Ionicons name="close" size={14} color="#FF3B30" />
                  ) : isCurrent ? (
                    <View style={[styles.innerDot, { backgroundColor: colors.primary }]} />
                  ) : (
                    <View style={styles.emptyDot} />
                  )}
                </View>

                {/* Text */}
                <View style={styles.stepText}>
                  <Text
                    style={[
                      styles.stepLabel,
                      isPending && styles.stepLabelPending,
                      isCurrent && { color: colors.primary },
                    ]}
                  >
                    {step.label}
                  </Text>
                  <Text style={styles.stepSublabel}>{step.sublabel}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  appId: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: colors.black,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  submittedAt: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: Typography.weights.semibold,
  },
  rejectedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF1F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: Spacing.md,
  },
  rejectedText: {
    fontSize: Typography.sizes.xs,
    color: '#FF3B30',
    flex: 1,
    lineHeight: 16,
  },
  tracker: {
    paddingLeft: 4,
  },
  stepRow: {
    position: 'relative',
  },
  lineContainer: {
    position: 'absolute',
    left: 15,
    top: -16,
    width: 2,
    height: 20,
  },
  line: {
    flex: 1,
    width: 2,
    borderRadius: 1,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C0C0C0',
  },
  stepText: {
    flex: 1,
    paddingTop: 4,
  },
  stepLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: colors.black,
    marginBottom: 2,
  },
  stepLabelPending: {
    color: '#A0A0A0',
  },
  stepSublabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    lineHeight: 16,
  },
});
