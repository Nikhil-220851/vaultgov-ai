import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Scheme, mockUserProfile } from '@/data/schemes';
import { colors } from '@/theme/colors';
import { Colors, Radius, Spacing, Typography } from '@/theme';

interface ApplicationSummaryProps {
  scheme: Scheme;
  applicationId?: string;
}

export function ApplicationSummary({ scheme, applicationId }: ApplicationSummaryProps) {
  const readyDocs = scheme.requiredDocuments.filter(
    (d) => d.status === 'uploaded' || d.status === 'verified'
  );
  const missingDocs = scheme.requiredDocuments.filter((d) => d.status === 'missing');
  const expiredDocs = scheme.requiredDocuments.filter((d) => d.status === 'expired');

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
      ? 'Partially Eligible'
      : 'Not Eligible';

  return (
    <View style={styles.container}>
      {/* Applicant Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="account-circle" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Applicant Details</Text>
        </View>
        <View style={styles.infoGrid}>
          <InfoRow label="Full Name" value={mockUserProfile.name} />
          <InfoRow label="Mobile Number" value={mockUserProfile.mobile} />
          <InfoRow label="Age" value={`${mockUserProfile.age} years`} />
          <InfoRow label="State" value={mockUserProfile.state} />
          <InfoRow label="Education" value={mockUserProfile.education} />
          <InfoRow label="Annual Income" value={`₹${mockUserProfile.annualIncome.toLocaleString('en-IN')}`} />
        </View>
      </View>

      {/* Scheme Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Scheme Details</Text>
        </View>
        <View style={styles.infoGrid}>
          <InfoRow label="Scheme" value={scheme.shortTitle} />
          <InfoRow label="Department" value={scheme.ministry} />
          <InfoRow label="Category" value={scheme.category} />
          <InfoRow label="Type" value={scheme.type} />
          <InfoRow label="Financial Benefit" value={scheme.financialAssistance} highlight />
          <InfoRow label="Application Fee" value={scheme.applicationFee === 0 ? '₹0 (Free)' : `₹${scheme.applicationFee}`} />
          <InfoRow label="Processing Time" value={scheme.processingTime} />
        </View>
      </View>

      {/* Eligibility Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Eligibility Status</Text>
        </View>
        <View style={[styles.eligibilityBanner, { backgroundColor: eligibilityColor + '15' }]}>
          <View style={[styles.eligibilityDot, { backgroundColor: eligibilityColor }]} />
          <Text style={[styles.eligibilityText, { color: eligibilityColor }]}>{eligibilityLabel}</Text>
          <Text style={[styles.eligibilityPct, { color: eligibilityColor }]}>
            {scheme.eligibilityPercentage}% match
          </Text>
        </View>
      </View>

      {/* Document Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="folder-check-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Document Summary</Text>
        </View>

        {readyDocs.length > 0 && (
          <View style={styles.docSection}>
            <Text style={styles.docSectionLabel}>Ready to submit</Text>
            {readyDocs.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
                <Ionicons name="checkmark-circle" size={14} color="#3CC556" />
                <Text style={styles.docName}>{doc.name}</Text>
              </View>
            ))}
          </View>
        )}

        {expiredDocs.length > 0 && (
          <View style={styles.docSection}>
            <Text style={[styles.docSectionLabel, { color: '#FF9800' }]}>Expired — renewal needed</Text>
            {expiredDocs.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
                <Ionicons name="alert-circle" size={14} color="#FF9800" />
                <Text style={styles.docName}>{doc.name}</Text>
              </View>
            ))}
          </View>
        )}

        {missingDocs.length > 0 && (
          <View style={styles.docSection}>
            <Text style={[styles.docSectionLabel, { color: '#FF3B30' }]}>Missing — to be submitted later</Text>
            {missingDocs.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
                <Ionicons name="close-circle" size={14} color="#FF3B30" />
                <Text style={styles.docName}>{doc.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Notice Box */}
      {missingDocs.length > 0 && (
        <View style={styles.noticeBox}>
          <MaterialCommunityIcons name="information" size={16} color="#FF9800" />
          <Text style={styles.noticeText}>
            {missingDocs.length} document{missingDocs.length > 1 ? 's are' : ' is'} missing. Your application
            will be submitted, and the department may request these documents during review.
          </Text>
        </View>
      )}

      {/* Application ID (if regenerating) */}
      {applicationId && (
        <View style={styles.appIdBox}>
          <Text style={styles.appIdLabel}>Application Reference</Text>
          <Text style={styles.appIdValue}>{applicationId}</Text>
        </View>
      )}

      {/* Fee */}
      <View style={styles.feeRow}>
        <Text style={styles.feeLabel}>Total Application Fee</Text>
        <Text style={styles.feeValue}>
          {scheme.applicationFee === 0 ? 'FREE' : `₹${scheme.applicationFee}`}
        </Text>
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  cardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: colors.black,
  },
  infoGrid: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
    flex: 1,
    marginRight: 8,
  },
  infoValue: {
    fontSize: Typography.sizes.xs,
    color: colors.black,
    fontWeight: Typography.weights.semibold,
    flex: 1.5,
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: colors.primary,
  },
  eligibilityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.sm,
    gap: 8,
  },
  eligibilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eligibilityText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    flex: 1,
  },
  eligibilityPct: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  docSection: {
    marginBottom: 10,
  },
  docSectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.darkGray,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  docName: {
    fontSize: Typography.sizes.sm,
    color: colors.black,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF7EC',
    borderRadius: Radius.sm,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  noticeText: {
    fontSize: Typography.sizes.xs,
    color: '#B36000',
    lineHeight: 18,
    flex: 1,
  },
  appIdBox: {
    backgroundColor: '#EBF2FF',
    borderRadius: Radius.sm,
    padding: 12,
    alignItems: 'center',
  },
  appIdLabel: {
    fontSize: Typography.sizes.xs,
    color: colors.primary,
    marginBottom: 4,
  },
  appIdValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F7',
    borderRadius: Radius.sm,
    padding: 14,
  },
  feeLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  feeValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: '#3CC556',
  },
});
