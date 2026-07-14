import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '@/services/firebase';
import { useUser } from '@/context/UserContext';
import { styles } from './styles';
import { apiClient, VaultGovStats } from '@/services/api';

// Subcomponents — use named imports to satisfy import/no-named-as-default
import { Header } from './components/Header';
import { Greeting } from './components/Greeting';
import { OverviewCard } from './components/OverviewCard';
import { QuickActionCard } from './components/QuickActionCard';
import { UploadDocumentSheet } from '@/features/documents/components/UploadDocumentSheet';
import {
  pickPdfDocument,
  SelectedFile,
} from '@/features/documents/upload.service';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user: dbUser } = useUser();
  const [stats, setStats] = useState<VaultGovStats | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiClient.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

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
    setIsSheetOpen(false);
    setTimeout(async () => {
      const file = await pickPdfDocument();
      if (file) handleFileSelected(file);
    }, 300);
  }, [handleFileSelected]);

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
              id: 'categories',
              label: 'Categories',
              count: stats?.total_categories ?? 0,
              iconName: 'folder-outline',
              type: 'success',
            }}
            isFirst={false}
            isLast={true}
            onPress={() => handleOverviewPress('docs')}
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
});

export default HomeScreen;
