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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { InformationCard } from '@/components/profile/InformationCard';
import { SettingsCard } from '@/components/profile/SettingsCard';
import { LinkedServicesCard } from '@/components/profile/LinkedServicesCard';
import { DocumentHealthCard } from '@/components/profile/DocumentHealthCard';
import { SignOutCard } from '@/components/profile/SignOutCard';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { useUser } from '@/context/UserContext';

const ACCOUNT_SETTINGS = [
  { id: 'privacy', icon: 'lock-closed-outline' as const, label: 'Privacy & Security', description: 'Manage PIN, biometric & data' },
  { id: 'notifications', icon: 'notifications-outline' as const, label: 'Notifications', description: 'Scheme alerts, document expiry', badge: 'On' },
  { id: 'language', icon: 'language-outline' as const, label: 'Language', description: 'Currently: English' },
  { id: 'accessibility', icon: 'eye-outline' as const, label: 'Accessibility', description: 'Text size and display options' },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & Support', description: 'FAQs, contact us, feedback' },
  { id: 'about', icon: 'information-circle-outline' as const, label: 'About VaultGov', description: 'Version 1.0.0 · Legal & Privacy' },
];

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

export function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading, signOut } = useUser();

  const handleSignOut = async () => {
    try {
      console.log('[ProfileScreen] User initiating sign out...');
      await signOut();
      router.replace('/login' as any);
      console.log('Navigation Redirected');
    } catch (error) {
      console.error('[ProfileScreen] Sign out failed:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleSettingPress = (id: string) => {
    Alert.alert('Coming Soon', `The "${id}" section is coming in the next update.`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryBlue} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  // Parse initials from name
  const name = user?.full_name || 'Citizen User';
  const phone = user?.mobile_number || 'Not Linked';
  const email = user?.email || 'Not Linked';
  const avatarInitials = name.trim().charAt(0).toUpperCase();

  const personalInfo = [
    { id: 'aadhaar', icon: 'finger-print-outline' as const, label: 'Aadhaar Status', value: user?.aadhaar_verified ? 'Verified' : 'Not Verified', isVerified: !!user?.aadhaar_verified },
    { id: 'dob', icon: 'calendar-outline' as const, label: 'Date of Birth', value: user?.date_of_birth || 'Not Provided', isVerified: false },
    { id: 'gender', icon: 'person-outline' as const, label: 'Gender', value: user?.gender || 'Not Provided', isVerified: false },
    { id: 'state', icon: 'location-outline' as const, label: 'State', value: user?.state || 'Not Provided', isVerified: false },
    { id: 'district', icon: 'map-outline' as const, label: 'District', value: user?.district || 'Not Provided', isVerified: false },
    { id: 'email', icon: 'mail-outline' as const, label: 'Email Address', value: email, isVerified: false },
    { id: 'mobile', icon: 'call-outline' as const, label: 'Mobile Number', value: phone, isVerified: true },
    { id: 'occupation', icon: 'briefcase-outline' as const, label: 'Occupation', value: user?.occupation || 'Not Provided', isVerified: false },
    { id: 'income', icon: 'cash-outline' as const, label: 'Income Category', value: user?.annual_income ? `${user.annual_income} Slab` : 'Not Provided', isVerified: false },
  ];

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
          name={name}
          phone={phone}
          avatarInitials={avatarInitials}
          isVerified={!!user?.aadhaar_verified}
          onEditPress={() => handleSettingPress('edit profile')}
        />

        {/* ─── Personal Information ─────────────────────────────────── */}
        <SectionHeader title="Personal Information" />
        <SectionCard>
          {personalInfo.map((item) => (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
  },
});

export default ProfileScreen;
