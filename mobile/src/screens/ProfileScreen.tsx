"use no memo";
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStatCard } from '@/components/profile/ProfileStatCard';
import { InformationCard } from '@/components/profile/InformationCard';
import { SettingsCard } from '@/components/profile/SettingsCard';
import { LinkedServicesCard } from '@/components/profile/LinkedServicesCard';
import { DocumentHealthCard } from '@/components/profile/DocumentHealthCard';
import { SignOutCard } from '@/components/profile/SignOutCard';
import { Colors, Spacing, Typography, Radius } from '@/theme';

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_USER = {
  name: 'Arjun Mehta',
  phone: '+91 81794 79468',
  email: 'arjun.mehta@gmail.com',
  avatarInitials: 'A',
  isVerified: true,
};

const PERSONAL_INFO = [
  { id: 'aadhaar', icon: 'finger-print-outline' as const, label: 'Aadhaar Number', value: 'XXXX XXXX 4821', isVerified: true },
  { id: 'dob', icon: 'calendar-outline' as const, label: 'Date of Birth', value: '15 March 1998', isVerified: false },
  { id: 'gender', icon: 'person-outline' as const, label: 'Gender', value: 'Male', isVerified: false },
  { id: 'state', icon: 'location-outline' as const, label: 'State', value: 'Maharashtra', isVerified: false },
  { id: 'district', icon: 'map-outline' as const, label: 'District', value: 'Pune', isVerified: false },
  { id: 'email', icon: 'mail-outline' as const, label: 'Email Address', value: 'arjun.mehta@gmail.com', isVerified: false },
  { id: 'mobile', icon: 'call-outline' as const, label: 'Mobile Number', value: '+91 81794 79468', isVerified: true },
  { id: 'occupation', icon: 'briefcase-outline' as const, label: 'Occupation', value: 'Software Engineer', isVerified: false },
  { id: 'income', icon: 'cash-outline' as const, label: 'Income Category', value: 'EWS (Below ₹3L)', isVerified: false },
];

const ACCOUNT_SETTINGS = [
  { id: 'privacy', icon: 'lock-closed-outline' as const, label: 'Privacy & Security', description: 'Manage PIN, biometric & data' },
  { id: 'notifications', icon: 'notifications-outline' as const, label: 'Notifications', description: 'Scheme alerts, document expiry', badge: 'On' },
  { id: 'language', icon: 'language-outline' as const, label: 'Language', description: 'Currently: English' },
  { id: 'accessibility', icon: 'eye-outline' as const, label: 'Accessibility', description: 'Text size and display options' },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & Support', description: 'FAQs, contact us, feedback' },
  { id: 'about', icon: 'information-circle-outline' as const, label: 'About VaultGov', description: 'Version 1.0.0 · Legal & Privacy' },
];

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={sectionStyles.header}>
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryBlue,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

// ─── Section Card Wrapper ─────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={cardWrapStyles.card}>{children}</View>;
}

const cardWrapStyles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const handleSignOut = () => {
    // In production: call Firebase signOut()
    console.log('[ProfileScreen] User signed out');
  };

  const handleSettingPress = (id: string) => {
    Alert.alert('Coming Soon', `The "${id}" section is coming in the next update.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#EBF2FF" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <ProfileHeader
          name={MOCK_USER.name}
          phone={MOCK_USER.phone}
          email={MOCK_USER.email}
          avatarInitials={MOCK_USER.avatarInitials}
          isVerified={MOCK_USER.isVerified}
          onEditPress={() => handleSettingPress('edit profile')}
          onSettingsPress={() => handleSettingPress('settings')}
        />

        {/* ─── Stats Row ───────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <ProfileStatCard
            icon="document-text-outline"
            label="Documents"
            value={12}
            color={Colors.primaryBlue}
          />
          <View style={styles.statGap} />
          <ProfileStatCard
            icon="ribbon-outline"
            label="Schemes"
            value={3}
            color="#9C27B0"
          />
          <View style={styles.statGap} />
          <ProfileStatCard
            icon="shield-checkmark-outline"
            label="Health Score"
            value={78}
            color={Colors.primaryGreen}
            suffix=""
          />
        </View>

        {/* ─── Personal Information ─────────────────────────────────── */}
        <SectionHeader title="Personal Information" />
        <SectionCard>
          {PERSONAL_INFO.map((item, index) => (
            <InformationCard
              key={item.id}
              icon={item.icon}
              label={item.label}
              value={item.value}
              isVerified={item.isVerified}
              onPress={() => handleSettingPress(item.label)}
            />
          ))}
        </SectionCard>

        {/* ─── Document Health Score ────────────────────────────────── */}
        <SectionHeader title="Document Health Score" />
        <SectionCard>
          <DocumentHealthCard
            score={78}
            total={100}
            expired={1}
            expiringSoon={2}
            verified={9}
          />
        </SectionCard>

        {/* ─── Linked Government Services ──────────────────────────── */}
        <SectionHeader title="Linked Government Services" />
        <SectionCard>
          <LinkedServicesCard />
        </SectionCard>

        {/* ─── Account & Settings ──────────────────────────────────── */}
        <SectionHeader title="Account & Settings" />
        <SectionCard>
          {ACCOUNT_SETTINGS.map((item, index) => (
            <SettingsCard
              key={item.id}
              icon={item.icon}
              label={item.label}
              description={item.description}
              badge={'badge' in item ? item.badge : undefined}
              isLast={index === ACCOUNT_SETTINGS.length - 1}
              onPress={() => handleSettingPress(item.label)}
            />
          ))}
        </SectionCard>

        {/* ─── Sign Out ─────────────────────────────────────────────── */}
        <View style={styles.signOutWrap}>
          <SignOutCard onSignOut={handleSignOut} />
        </View>

        {/* App Version */}
        <Text style={styles.version}>VaultGov AI · v1.0.0 · Made in India 🇮🇳</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EBF2FF',
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  statGap: {
    width: Spacing.sm,
  },
  signOutWrap: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  version: {
    textAlign: 'center',
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
