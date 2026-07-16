"use no memo";
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Scheme, RequiredDocument } from '@/data/schemes';
import { colors } from '@/theme/colors';
import { Colors, Radius, Spacing, Typography } from '@/theme';

interface SchemeDetailsScreenProps {
  scheme: Scheme;
}

export function SchemeDetailsScreen({ scheme }: SchemeDetailsScreenProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    insights: true,
    documents: true,
    description: true,
    benefits: false,
    faq: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApply = async () => {
    try {
      const canOpen = await Linking.canOpenURL(scheme.officialApplyLink);
      if (canOpen) {
        await Linking.openURL(scheme.officialApplyLink);
      } else {
        Alert.alert('Error', 'Cannot open the official application website link.');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while trying to redirect to the official site.');
    }
  };

  // Document Metrics
  const documents = scheme.requiredDocuments || [];
  const totalDocs = documents.length;
  const readyDocs = documents.filter((d) => d.status === 'verified' || d.status === 'uploaded').length;
  const completionPct = totalDocs > 0 ? Math.round((readyDocs / totalDocs) * 100) : 100;
  const missingDocs = documents.filter((d) => d.status === 'missing');

  // Mapped Eligibility Status Text
  const eligibilityLabelMap: Record<string, string> = {
    highly_recommended: 'Likely Eligible',
    eligible: 'Potential Match',
    partially_eligible: 'Partial Match',
    not_eligible: 'Unlikely Match',
  };
  const eligibilityLabel = eligibilityLabelMap[scheme.eligibilityStatus] || 'Potential Match';

  const eligibilityColorMap: Record<string, string> = {
    highly_recommended: '#1B8A3E',
    eligible: '#3CC556',
    partially_eligible: '#FF9800',
    not_eligible: '#FF3B30',
  };
  const eligibilityColor = eligibilityColorMap[scheme.eligibilityStatus] || '#3CC556';

  // Verification Fallbacks
  const sourceName = scheme.sourceName || 'Information currently unavailable';
  const sourceURL = scheme.sourceURL || null;
  const verifiedBy = scheme.verifiedBy || 'Information currently unavailable';
  const verificationDate = scheme.verificationDate
    ? scheme.verificationDate.substring(0, 10)
    : 'Information currently unavailable';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color={colors.black} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Scheme Details</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      {/* ─── Content ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: scheme.accentColor }]}>
          <View style={styles.bannerIconWrap}>
            <MaterialCommunityIcons name={scheme.iconName as any} size={44} color={colors.white} />
          </View>
          <Text style={styles.bannerTitle}>{scheme.title}</Text>
          <Text style={styles.bannerMinistry} numberOfLines={2}>
            {scheme.ministry}
          </Text>
          <View style={styles.bannerBadgeRow}>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>{scheme.category}</Text>
            </View>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>{scheme.type}</Text>
            </View>
            {scheme.renewable && (
              <View style={styles.bannerBadge}>
                <MaterialCommunityIcons name="refresh" size={11} color="rgba(255,255,255,0.85)" />
                <Text style={styles.bannerBadgeText}> Renewable</Text>
              </View>
            )}
          </View>
        </View>

        {/* Verification Credential Block */}
        <View style={styles.verifiedContainer}>
          <View style={styles.verifiedHeader}>
            <Ionicons name="shield-checkmark" size={18} color="#1B8A3E" />
            <Text style={styles.verifiedTitle}>Data Authenticity Verification</Text>
          </View>
          <View style={styles.verifiedDetails}>
            <View style={styles.verifiedRow}>
              <Text style={styles.verifiedLabel}>Verified By:</Text>
              <Text style={styles.verifiedValue}>{verifiedBy}</Text>
            </View>
            <View style={styles.verifiedRow}>
              <Text style={styles.verifiedLabel}>Last Verified:</Text>
              <Text style={styles.verifiedValue}>{verificationDate}</Text>
            </View>
            <View style={styles.verifiedRow}>
              <Text style={styles.verifiedLabel}>Official Source:</Text>
              {sourceURL ? (
                <TouchableOpacity onPress={() => Linking.openURL(sourceURL)}>
                  <Text style={[styles.verifiedValue, styles.verifiedLink]}>{sourceName} ↗</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.verifiedValue}>{sourceName}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Match Insights Banner */}
        <View style={styles.insightsBanner}>
          <View style={styles.insightsLabelRow}>
            <Text style={styles.insightsTitle}>Eligibility Match Score</Text>
            <View style={[styles.insightsBadge, { backgroundColor: eligibilityColor + '20' }]}>
              <Text style={[styles.insightsBadgeText, { color: eligibilityColor }]}>
                {eligibilityLabel}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${scheme.eligibilityPercentage}%`, backgroundColor: eligibilityColor }]} />
            </View>
            <Text style={[styles.progressText, { color: eligibilityColor }]}>{scheme.eligibilityPercentage}%</Text>
          </View>

          <Text style={styles.disclaimerText}>
            Final eligibility is determined by the official Government authority. Please verify the complete eligibility criteria on the official website before applying.
          </Text>
        </View>

        {/* Transparent Matching Criteria Insights ("Why This Scheme") */}
        <CollapsibleSection
          title="Why This Scheme (Matching Insights)"
          isExpanded={expandedSections.insights}
          onToggle={() => toggleSection('insights')}
        >
          {scheme.eligibilityCriteria.map((c) => (
            <View key={c.id} style={styles.criterionPreviewRow}>
              <Ionicons
                name={c.passed ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={c.passed ? '#3CC556' : '#FF3B30'}
                style={{ marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.criterionPreviewText}>
                  <Text style={styles.criterionBold}>{c.label}:</Text> Scheme requires{' '}
                  <Text style={styles.criterionBold}>{c.required}</Text> (Your value is{' '}
                  <Text style={styles.criterionBold}>{c.userValue}</Text>)
                </Text>
                {c.reason ? <Text style={styles.criterionReasonText}>{c.reason}</Text> : null}
              </View>
            </View>
          ))}
        </CollapsibleSection>

        {/* Collapsible Section: Required Certificates */}
        <CollapsibleSection
          title={`Required Certificates (${readyDocs}/${totalDocs} Ready)`}
          isExpanded={expandedSections.documents}
          onToggle={() => toggleSection('documents')}
        >
          <View style={styles.docMetricsBlock}>
            <Text style={styles.docMetricsText}>
              Locker Completion Status: <Text style={styles.criterionBold}>{completionPct}%</Text>
            </Text>
            {missingDocs.length > 0 ? (
              <Text style={styles.missingDocsText}>
                Missing Documents:{' '}
                <Text style={styles.missingDocsList}>{missingDocs.map((d) => d.name).join(', ')}</Text>
              </Text>
            ) : (
              <Text style={[styles.missingDocsText, { color: '#1B8A3E' }]}>
                ✓ All required documents are present in your Document Locker.
              </Text>
            )}
          </View>

          {documents.map((doc) => (
            <View key={doc.id} style={styles.docPreviewRow}>
              <View
                style={[
                  styles.docStatusDot,
                  { backgroundColor: doc.status === 'verified' || doc.status === 'uploaded' ? '#3CC556' : '#FF3B30' },
                ]}
              />
              <MaterialCommunityIcons
                name={doc.iconName as any}
                size={18}
                color={doc.status === 'verified' || doc.status === 'uploaded' ? '#3CC556' : Colors.darkGray}
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.docPreviewName}>{doc.name}</Text>
                {doc.description && <Text style={styles.docPreviewDesc}>{doc.description}</Text>}
              </View>
              <Text
                style={[
                  styles.docStatusLabel,
                  { color: doc.status === 'verified' || doc.status === 'uploaded' ? '#3CC556' : '#FF9800' },
                ]}
              >
                {doc.status === 'verified' ? '✓ Verified' : doc.status === 'uploaded' ? '✓ Uploaded' : 'Missing'}
              </Text>
            </View>
          ))}
        </CollapsibleSection>

        {/* About Scheme Collapsible */}
        <CollapsibleSection
          title="About this Scheme"
          isExpanded={expandedSections.description}
          onToggle={() => toggleSection('description')}
        >
          <Text style={styles.sectionBody}>{scheme.description}</Text>
        </CollapsibleSection>

        {/* Benefits Collapsible */}
        <CollapsibleSection
          title="Benefits"
          isExpanded={expandedSections.benefits}
          onToggle={() => toggleSection('benefits')}
        >
          {scheme.benefits.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </CollapsibleSection>

        {/* FAQs Collapsible */}
        {scheme.faqs && scheme.faqs.length > 0 && (
          <CollapsibleSection
            title="Frequently Asked Questions (FAQs)"
            isExpanded={expandedSections.faq}
            onToggle={() => toggleSection('faq')}
          >
            {scheme.faqs.map((faq, i) => (
              <View key={faq.id} style={[styles.faqItem, i < scheme.faqs.length - 1 && styles.faqItemGap]}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Sticky CTA: Redirection Only ────────────────────────────────── */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleApply} activeOpacity={0.88}>
          <Text style={styles.ctaBtnText}>Apply on Official Website</Text>
          <Ionicons name="open-outline" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.8}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.darkGray} />
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: colors.black,
  },
  topBarRight: {
    width: 38,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  banner: {
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  bannerIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  bannerMinistry: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 20,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  bannerBadgeText: {
    fontSize: 12,
    fontWeight: Typography.weights.semibold,
    color: colors.white,
  },
  // Data Authenticity verified block
  verifiedContainer: {
    margin: Spacing.md,
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: '#E6EFE6',
    borderRadius: Radius.md,
    padding: 16,
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  verifiedTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: '#1B8A3E',
  },
  verifiedDetails: {
    gap: 6,
  },
  verifiedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  verifiedValue: {
    fontSize: Typography.sizes.xs,
    color: colors.black,
    fontWeight: Typography.weights.semibold,
  },
  verifiedLink: {
    color: colors.primary,
  },
  // Match insights
  insightsBanner: {
    backgroundColor: colors.white,
    borderRadius: Radius.md,
    padding: 16,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  insightsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: colors.black,
  },
  insightsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  insightsBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  progressText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#FF9800',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  // Collapsible Section style
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: colors.black,
  },
  sectionContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  sectionBody: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    lineHeight: 20,
    flex: 1,
  },
  criterionPreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  criterionPreviewText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    lineHeight: 20,
  },
  criterionBold: {
    fontWeight: Typography.weights.bold,
    color: colors.black,
  },
  criterionReasonText: {
    fontSize: Typography.sizes.xs,
    color: '#FF3B30',
    marginTop: 2,
  },
  // Required certificates checklist
  docMetricsBlock: {
    backgroundColor: '#F5F5F7',
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 14,
  },
  docMetricsText: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  missingDocsText: {
    fontSize: Typography.sizes.xs,
    color: '#FF3B30',
    marginTop: 4,
  },
  missingDocsList: {
    fontWeight: Typography.weights.semibold,
  },
  docPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  docStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    flexShrink: 0,
  },
  docPreviewName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: colors.black,
  },
  docPreviewDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginTop: 2,
  },
  docStatusLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    marginLeft: 8,
    flexShrink: 0,
  },
  // FAQs
  faqItem: {
    marginBottom: 0,
  },
  faqItemGap: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  faqQuestion: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: colors.black,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    lineHeight: 20,
  },
  // Bottom Sticky CTA
  ctaContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 8 : Spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: Radius.button,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  ctaBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: colors.white,
  },
});
