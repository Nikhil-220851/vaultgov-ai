import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { auth } from '@/services/firebase';
import { useUser } from '@/context/UserContext';
import { styles } from './styles';
import { VaultGovStats } from '@/services/api';
import { useStatsStore } from '@/store/useStatsStore';
import { Colors, Typography, Spacing } from '@/theme';

// Subcomponents — use named imports to satisfy import/no-named-as-default
import { Header } from './components/Header';
import { Greeting } from './components/Greeting';
import { OverviewCard } from './components/OverviewCard';
import { QuickActionCard } from './components/QuickActionCard';
import { RecentDocumentCard } from './components/RecentDocumentCard';
import { UploadDocumentSheet } from '@/features/documents/components/UploadDocumentSheet';
import {
  pickPdfDocument,
  SelectedFile,
} from '@/features/documents/upload.service';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // Prevents concurrent/duplicate document picker invocations
  const [isPickingPdf, setIsPickingPdf] = useState(false);
  const { user: dbUser } = useUser();
  const { stats, isLoading: loading, fetchStats } = useStatsStore();

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  // Pull logged-in user details if available
  const displayName = dbUser?.full_name || auth.currentUser?.displayName || auth.currentUser?.phoneNumber || 'User';
  // Get first letter of name for avatar
  const avatarInitials = displayName ? displayName.trim().charAt(0).toUpperCase() : 'U';

  const QUICK_ACTIONS = [
    {
      id: 'upload',
      title: 'Upload document',
      subtitle: 'Photo · PDF · Image',
      iconName: 'cloud-upload-outline',
    },
  ];


  const handleAvatarPress = () => {
    console.log('[HomeScreen] User profile avatar pressed');
  };

  const handleOverviewPress = (id: string) => {
    console.log('[HomeScreen] Overview card pressed:', id);
    if (id === 'docs' || id === 'expiring') {
      router.push('/(tabs)/docs' as any);
    } else if (id === 'schemes') {
      router.push('/(tabs)/schemes' as any);
    }
  };

  /** Navigate to Document Details from a recent-upload card tap. */
  const handleRecentDocumentPress = useCallback(
    (id: string) => {
      console.log('[HomeScreen] Recent document pressed:', id);
      router.push({
        pathname: '/document/[id]' as any,
        params: { id },
      });
    },
    [router]
  );



  // ── Upload sheet handlers ──────────────────────────────────────────────────

  const handleFileSelected = useCallback((file: SelectedFile) => {
    router.push({
      pathname: '/document-preview' as any,
      params: {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        source: file.source,
        size: file.size !== undefined ? String(file.size) : '',
      },
    });
  }, [router]);

  const handleTakePhoto = useCallback(async () => {
    setIsSheetOpen(false);
    setTimeout(() => {
      router.push('/scan/camera' as any);
    }, 300);
  }, [router]);

  const handleUploadPdf = useCallback(async () => {
    console.log('[PDF Upload] Upload button pressed');

    // Guard: if a picker is already open (double-tap / re-entrant call), do nothing.
    // The module-level flag in upload.service.ts is the final backstop, but this
    // state-level guard disables the button in the UI immediately.
    if (isPickingPdf) {
      console.warn('[PDF Upload] Pick already in progress, ignoring tap');
      return;
    }

    setIsSheetOpen(false);
    setIsPickingPdf(true);

    try {
      const file = await pickPdfDocument();
      console.log('[PDF Upload] Picker returned:', file ? file.name : 'canceled');
      if (file) {
        console.log('[PDF Upload] Upload started');
        handleFileSelected(file);
        console.log('[PDF Upload] Upload completed (navigated to preview)');
      }
    } finally {
      setIsPickingPdf(false);
    }
  }, [handleFileSelected, isPickingPdf]);

  const handleUploadImage = useCallback(async () => {
    setIsSheetOpen(false);
    setTimeout(() => {
      router.push('/scan' as any);
    }, 300);
  }, [router]);

  const handleQuickActionPress = (id: string) => {
    console.log('[HomeScreen] Quick action card pressed:', id);
    if (id === 'upload') {
      setIsSheetOpen(true);
    }
  };

  return (
    <SafeAreaView style={localStyles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, localStyles.scrollContainer]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Header avatarInitials={avatarInitials} onPressAvatar={handleAvatarPress} />

        {/* Greeting */}
        <Greeting userName={displayName} currentDate={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />

        {/* Overview Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OVERVIEW</Text>
        </View>
        <View style={styles.overviewGrid}>
          <OverviewCard
            item={{
              id: 'docs',
              label: 'Documents',
              count: stats?.total_documents ?? 0,
              iconName: 'document-text-outline',
              type: 'neutral',
            }}
            isFirst={true}
            isLast={false}
            onPress={() => handleOverviewPress('docs')}
          />
          <OverviewCard
            item={{
              id: 'health',
              label: 'Avg Health',
              count: stats?.average_health_score ?? 0,
              iconName: 'pulse-outline',
              type: 'success',
            }}
            isFirst={false}
            isLast={true}
            onPress={() => handleOverviewPress('health')}
          />
        </View>

        {loading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#aaa' }}>Loading dashboard...</Text>
          </View>
        ) : (!stats?.total_documents ? (
          <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>No documents yet</Text>
            <Text style={{ fontSize: 14, color: '#777', marginTop: 4 }}>Scan your first document to get started</Text>
          </View>
        ) : null)}

        {/* Recent Documents Section — only shown when uploads exist */}
        {stats && stats.recent_uploads && stats.recent_uploads.length > 0 && (
          <>
            <View style={[styles.sectionHeader, localStyles.recentHeader]}>
              <Text style={styles.sectionTitle}>RECENT DOCUMENTS</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/docs' as any)}
                accessibilityRole="button"
                accessibilityLabel="View all documents"
              >
                <Text style={localStyles.viewAll}>View all</Text>
              </Pressable>
            </View>
            {stats.recent_uploads.slice(0, 3).map((doc) => (
              <RecentDocumentCard
                key={doc.id}
                item={doc}
                onPress={() => handleRecentDocumentPress(doc.id)}
              />
            ))}
          </>
        )}

        {/* Quick Actions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleDark}>QUICK ACTIONS</Text>
        </View>
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.id}
            item={action}
            onPress={() => handleQuickActionPress(action.id)}
          />
        ))}
      </ScrollView>

      {/* Shared Upload Document Bottom Sheet */}
      <UploadDocumentSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onFilePicked={handleFileSelected}
        onTakePhoto={handleTakePhoto}
        onUploadPdf={handleUploadPdf}
        onUploadImage={handleUploadImage}
        isPdfPickingActive={isPickingPdf}
      />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F5',
  },
  scrollContainer: {
    paddingBottom: 130, // Extra bottom padding so scroll content clears sticky tab navigation
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
    fontFamily: Typography.fontFamilies.sans,
  },
});

export default HomeScreen;
