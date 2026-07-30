"use no memo";
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SummaryCard } from '@/components/profile/SummaryCard';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { SettingsRow } from '@/components/profile/SettingsRow';
import { LogoutButton } from '@/components/profile/LogoutButton';
import {
  ProfileHeaderSkeleton,
  SummaryCardSkeleton,
  SettingsSectionSkeleton,
} from '@/components/profile/ProfileSkeletons';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { useUser } from '@/context/UserContext';
import { useStatsStore } from '@/store/useStatsStore';
import { useDocumentStore } from '@/features/documents/store/useDocumentStore';

export function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading: isUserLoading, signOut, refetchUser } = useUser();
  const { stats, isLoading: isStatsLoading, fetchStats } = useStatsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch of stats if not available
  useEffect(() => {
    if (!stats) {
      fetchStats().catch((err) => {
        setError('Failed to load profile data.');
      });
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([refetchUser(), fetchStats()]);
    } catch (err) {
      setError('Unable to load profile. Pull down to retry.');
    } finally {
      setRefreshing(false);
    }
  }, [refetchUser, fetchStats]);

  const handleSignOut = async () => {
    try {
      console.log('[ProfileScreen] User initiating sign out...');
      await signOut();
      useStatsStore.setState({ stats: null, isLoading: true });
      try {
        useDocumentStore.setState({ documents: [], isHydrating: true });
      } catch (e) {
        // Ignored if document store not initialized
      }
      router.replace('/login' as any);
      console.log('Navigation Redirected');
    } catch (err) {
      console.error('[ProfileScreen] Sign out failed:', err);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleNavigation = (route: string) => {
    if (route === 'My Documents') {
      router.push('/(tabs)/docs' as any);
    } else if (route === 'Saved Schemes') {
      // TODO: Replace with actual saved schemes route when available
      Alert.alert('Coming Soon', 'Saved Schemes navigation is coming soon.');
    } else {
      Alert.alert('Coming Soon', `The "${route}" section is coming in the next update.`);
    }
  };

  // Loading state handling with Skeletons
  const showSkeletons = isUserLoading || (isStatsLoading && !stats);

  if (showSkeletons && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#EBF2FF" />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <ProfileHeaderSkeleton />
          <SummaryCardSkeleton />
          <SettingsSectionSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const name = user?.full_name || 'Citizen User';
  const phone = user?.mobile_number || 'Not Linked';
  const email = user?.email || undefined;
  const profileImageUrl = user?.profile_image_url || null;

  const memberSinceYear = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : new Date().getFullYear();

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#EBF2FF" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primaryBlue]}
            tintColor={Colors.primaryBlue}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={32} color={Colors.darkGray} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <ProfileHeader
          name={name}
          phone={phone}
          email={email}
          profileImageUrl={profileImageUrl}
          isVerified={!!user?.aadhaar_verified}
          onEditPress={() => router.push('/edit-profile' as any)}
        />

        <SummaryCard
          documentsStored={stats?.total_documents || 0}
          savedSchemes={0} // TODO: Connect to backend saved schemes endpoint when ready
          expiringSoon={stats?.expiring_soon || 0}
          memberSinceYear={memberSinceYear}
        />

        <SettingsSection title="Vault Section">
          <SettingsRow icon="document-text-outline" title="My Documents" subtitle="View and manage stored files" onPress={() => handleNavigation('My Documents')} />
          <SettingsRow icon="bookmark-outline" title="Saved Schemes" subtitle="Schemes you have bookmarked" onPress={() => handleNavigation('Saved Schemes')} />
          <SettingsRow icon="notifications-outline" title="Notification Settings" subtitle="Alerts and reminders" onPress={() => handleNavigation('Notification Settings')} />
          <SettingsRow icon="options-outline" title="AI Preferences" subtitle="Customize AI recommendations" onPress={() => handleNavigation('AI Preferences')} isLast />
        </SettingsSection>

        <SettingsSection title="Security Section">
          <SettingsRow icon="lock-closed-outline" title="Privacy Policy" onPress={() => handleNavigation('Privacy Policy')} />
          <SettingsRow icon="document-outline" title="Terms & Conditions" onPress={() => handleNavigation('Terms & Conditions')} />
          <SettingsRow icon="shield-checkmark-outline" title="Permissions" subtitle="Manage app access" onPress={() => handleNavigation('Permissions')} />
          <SettingsRow icon="trash-outline" title="Delete Account" destructive onPress={() => handleNavigation('Delete Account')} isLast />
        </SettingsSection>

        <SettingsSection title="Support Section">
          <SettingsRow icon="help-circle-outline" title="Help Center" onPress={() => handleNavigation('Help Center')} />
          <SettingsRow icon="mail-outline" title="Contact Support" onPress={() => handleNavigation('Contact Support')} />
          <SettingsRow icon="chatbox-ellipses-outline" title="Feedback" onPress={() => handleNavigation('Feedback')} />
          <SettingsRow icon="information-circle-outline" title="About VaultGov AI" onPress={() => handleNavigation('About VaultGov AI')} />
          <SettingsRow icon="phone-portrait-outline" title="App Version" subtitle={`v${appVersion}`} onPress={() => {}} isLast />
        </SettingsSection>

        <LogoutButton onSignOut={handleSignOut} />
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
    paddingBottom: Spacing.xl,
  },
  errorContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dangerRed + '40',
  },
  errorText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.button,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.sm,
  },
});

export default ProfileScreen;
