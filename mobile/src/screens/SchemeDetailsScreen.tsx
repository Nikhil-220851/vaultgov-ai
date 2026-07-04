"use no memo";
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Scheme,
  RequiredDocument,
  generateApplicationId,
} from '@/data/schemes';
import { EligibilityCard } from '@/components/schemes/EligibilityCard';
import { RequiredDocumentCard } from '@/components/schemes/RequiredDocumentCard';
import { ApplicationSummary } from '@/components/schemes/ApplicationSummary';
import { colors } from '@/theme/colors';
import { Colors, Radius, Spacing, Typography } from '@/theme';

type Step = 0 | 1 | 2 | 3; // Details | Eligibility | Documents | Review

const STEP_TITLES: Record<Step, string> = {
  0: 'Scheme Details',
  1: 'Eligibility Check',
  2: 'Required Documents',
  3: 'Application Review',
};

interface SchemeDetailsScreenProps {
  scheme: Scheme;
}

export function SchemeDetailsScreen({ scheme }: SchemeDetailsScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    benefits: false,
    eligibility: false,
    documents: false,
    faq: false,
  });
  const [documents, setDocuments] = useState<RequiredDocument[]>(scheme.requiredDocuments);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationId] = useState(generateApplicationId());

  const handleBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as Step);
    } else {
      setConfirmVisible(true);
    }
  };

  const handleSubmit = async () => {
    setConfirmVisible(false);
    setSubmitting(true);

    // Store in AsyncStorage
    try {
      const stored = await AsyncStorage.getItem('vaultgov_applied_schemes');
      const existing = stored ? JSON.parse(stored) : [];
      const newEntry = {
        schemeId: scheme.id,
        applicationId,
        applicationDate: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        status: 'submitted',
        submittedAt: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      };
      await AsyncStorage.setItem(
        'vaultgov_applied_schemes',
        JSON.stringify([...existing, newEntry])
      );
    } catch {
      // silent fail
    }

    // Simulate processing
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
    setSubmitting(false);

    router.replace({
      pathname: '/schemes/success' as any,
      params: {
        applicationId,
        schemeName: scheme.shortTitle,
        processingTime: scheme.processingTime,
      },
    });
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDocUpload = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: 'uploaded' as const } : d))
    );
  };

  const handleDocView = (docId: string) => {
    Alert.alert('Document Preview', 'Document viewer will open here in the full app.');
  };

  const handleDocReplace = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: 'uploaded' as const } : d))
    );
  };

  const getCTALabel = () => {
    if (step === 0) return 'Check Eligibility';
    if (step === 1) return 'View Required Documents';
    if (step === 2) return 'Review Application';
    return 'Submit Application';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color={colors.black} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>{STEP_TITLES[step]}</Text>
          {step > 0 && (
            <Text style={styles.stepIndicator}>Step {step} of 3</Text>
          )}
        </View>
        <View style={styles.topBarRight} />
      </View>

      {/* ─── Step Progress Bar ───────────────────────────────────────────── */}
      {step > 0 && (
        <View style={styles.stepProgressBar}>
          {([1, 2, 3] as const).map((s) => (
            <View
              key={s}
              style={[
                styles.stepSegment,
                s <= step ? styles.stepSegmentActive : styles.stepSegmentInactive,
              ]}
            />
          ))}
        </View>
      )}

      {/* ─── Content ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 0: Details ─────────────────────────────────────────────── */}
        {step === 0 && (
          <View>
            {/* Banner */}
            <View style={[styles.banner, { backgroundColor: scheme.accentColor }]}>
              <View style={styles.bannerIconWrap}>
                <MaterialCommunityIcons name={scheme.iconName as any} size={44} color={colors.white} />
              </View>
              <Text style={styles.bannerTitle}>{scheme.shortTitle}</Text>
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

            {/* Key Stats Row */}
            <View style={styles.statsRow}>
              <StatCard
                icon="cash-outline"
                label="Benefit"
                value={scheme.financialAssistance}
              />
              <StatCard
                icon="calendar-outline"
                label="Deadline"
                value={scheme.deadline}
              />
              <StatCard
                icon="time-outline"
                label="Processing"
                value={scheme.processingTime}
              />
            </View>

            {/* Collapsible Sections */}
            <CollapsibleSection
              title="About this Scheme"
              isExpanded={expandedSections.description}
              onToggle={() => toggleSection('description')}
            >
              <Text style={styles.sectionBody}>{scheme.description}</Text>
            </CollapsibleSection>

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

            <CollapsibleSection
              title="Eligibility Criteria"
              isExpanded={expandedSections.eligibility}
              onToggle={() => toggleSection('eligibility')}
            >
              {scheme.eligibilityCriteria.map((c) => (
                <View key={c.id} style={styles.criterionPreviewRow}>
                  <Ionicons
                    name={c.passed ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={c.passed ? '#3CC556' : '#FF3B30'}
                  />
                  <Text style={styles.criterionPreviewText}>{c.label}: {c.required}</Text>
                </View>
              ))}
            </CollapsibleSection>

            <CollapsibleSection
              title="FAQs"
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

            {/* Official Portal */}
            <View style={styles.portalRow}>
              <Ionicons name="globe-outline" size={16} color={colors.primary} />
              <Text style={styles.portalLabel}>Official Portal: </Text>
              <Text style={styles.portalUrl} numberOfLines={1}>{scheme.officialPortal}</Text>
            </View>
          </View>
        )}

        {/* ── Step 1: Eligibility Check ─────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHint}>
              <MaterialCommunityIcons name="account-check-outline" size={16} color={colors.primary} />
              <Text style={styles.stepHintText}>
                Based on your VaultGov profile (Arjun Mehta, 28yrs, ₹2.8L income, Maharashtra)
              </Text>
            </View>
            <EligibilityCard
              status={scheme.eligibilityStatus}
              criteria={scheme.eligibilityCriteria}
              eligibilityPercentage={scheme.eligibilityPercentage}
            />
          </View>
        )}

        {/* ── Step 2: Documents ─────────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHint}>
              <MaterialCommunityIcons name="folder-open-outline" size={16} color={colors.primary} />
              <Text style={styles.stepHintText}>
                {documents.filter((d) => d.status === 'missing').length} documents missing.
                Upload them or proceed — the department may request them later.
              </Text>
            </View>
            {documents.map((doc) => (
              <RequiredDocumentCard
                key={doc.id}
                document={doc}
                onUpload={handleDocUpload}
                onView={handleDocView}
                onReplace={handleDocReplace}
              />
            ))}
          </View>
        )}

        {/* ── Step 3: Review ────────────────────────────────────────────── */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHint}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={16} color={colors.primary} />
              <Text style={styles.stepHintText}>
                Review your application details before submitting. You cannot edit after submission.
              </Text>
            </View>
            <ApplicationSummary scheme={{ ...scheme, requiredDocuments: documents }} applicationId={applicationId} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Sticky CTA ──────────────────────────────────────────────────── */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleNext} activeOpacity={0.88}>
          <Text style={styles.ctaBtnText}>{getCTALabel()}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* ─── Confirmation Modal ───────────────────────────────────────────── */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="send" size={28} color={colors.primary} />
            </View>
            <Text style={styles.confirmTitle}>Confirm Application</Text>
            <Text style={styles.confirmMessage}>
              You are about to submit your application for{' '}
              <Text style={styles.confirmSchemeName}>{scheme.shortTitle}</Text>.
              {'\n\n'}This action cannot be undone. All submitted information will be
              reviewed by the relevant government department.
            </Text>
            <View style={styles.confirmFeeRow}>
              <Text style={styles.confirmFeeLabel}>Application Fee</Text>
              <Text style={styles.confirmFeeValue}>
                {scheme.applicationFee === 0 ? 'FREE' : `₹${scheme.applicationFee}`}
              </Text>
            </View>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSubmitBtn}
                onPress={handleSubmit}
                activeOpacity={0.88}
              >
                <Text style={styles.confirmSubmitText}>Submit</Text>
                <Ionicons name="checkmark" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Submitting Overlay ───────────────────────────────────────────── */}
      {submitting && (
        <View style={styles.submittingOverlay}>
          <View style={styles.submittingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.submittingTitle}>Submitting Application</Text>
            <Text style={styles.submittingSubtitle}>
              Please wait while we process your application...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={colors.primary} style={{ marginBottom: 4 }} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

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
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.darkGray}
        />
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
  // ── Top Bar ──────────────────────────────────────────────────────────────────
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
  stepIndicator: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginTop: 2,
  },
  topBarRight: {
    width: 38,
  },
  // ── Step Progress ─────────────────────────────────────────────────────────────
  stepProgressBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 4,
    backgroundColor: colors.background,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 99,
  },
  stepSegmentActive: {
    backgroundColor: colors.primary,
  },
  stepSegmentInactive: {
    backgroundColor: '#E5E5EA',
  },
  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  // ── Banner ───────────────────────────────────────────────────────────────────
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
    fontSize: 22,
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
  // ── Stats Row ────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  statLabel: {
    fontSize: 10,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
    lineHeight: 15,
  },
  // ── Collapsible Section ───────────────────────────────────────────────────────
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
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
    marginBottom: 8,
  },
  criterionPreviewText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    flex: 1,
    lineHeight: 20,
  },
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
  portalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: '#EBF2FF',
    borderRadius: Radius.sm,
    padding: 12,
    gap: 6,
  },
  portalLabel: {
    fontSize: Typography.sizes.xs,
    color: colors.primary,
    fontWeight: Typography.weights.medium,
  },
  portalUrl: {
    fontSize: Typography.sizes.xs,
    color: colors.primary,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
  // ── Step Container ────────────────────────────────────────────────────────────
  stepContainer: {
    paddingTop: Spacing.md,
  },
  stepHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EBF2FF',
    borderRadius: Radius.sm,
    padding: 12,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepHintText: {
    fontSize: Typography.sizes.xs,
    color: colors.primary,
    lineHeight: 16,
    flex: 1,
  },
  // ── CTA ───────────────────────────────────────────────────────────────────────
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
  // ── Confirmation Modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  confirmCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  confirmIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  confirmTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: colors.black,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  confirmSchemeName: {
    fontWeight: Typography.weights.bold,
    color: colors.black,
  },
  confirmFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F7',
    borderRadius: Radius.sm,
    padding: 14,
    width: '100%',
    marginBottom: Spacing.md,
  },
  confirmFeeLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  confirmFeeValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: '#3CC556',
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.darkGray,
  },
  confirmSubmitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: Radius.button,
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  confirmSubmitText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: colors.white,
  },
  // ── Submitting Overlay ────────────────────────────────────────────────────────
  submittingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: 240,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  submittingTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: colors.black,
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  submittingSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 16,
  },
});
