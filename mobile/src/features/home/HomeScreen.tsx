import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '@/services/firebase';
import { styles } from './styles';
import {
  MOCK_USER,
  MOCK_DATE,
  MOCK_HEALTH_SCORE,
  MOCK_OVERVIEW,
  MOCK_ALERTS,
  MOCK_SCHEMES,
  MOCK_QUICK_ACTIONS,
} from './constants';

// Subcomponents — use named imports to satisfy import/no-named-as-default
import { Header } from './components/Header';
import { Greeting } from './components/Greeting';
import { HealthScoreCard } from './components/HealthScoreCard';
import { OverviewCard } from './components/OverviewCard';
import { AlertDocumentCard } from './components/AlertDocumentCard';
import { SchemeCard } from './components/SchemeCard';
import { QuickActionCard } from './components/QuickActionCard';
import { UploadDocumentSheet } from '@/features/documents/components/UploadDocumentSheet';
import {
  captureWithCamera,
  pickFromGallery,
  pickPdfDocument,
  SelectedFile,
} from '@/features/documents/upload.service';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Pull logged-in user details if available, fallback to mock
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.phoneNumber || MOCK_USER.name;
  // Get first letter of name for avatar
  const avatarInitials = displayName ? displayName.trim().charAt(0).toUpperCase() : MOCK_USER.avatarInitials;

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

  const handleAlertPress = (id: string) => {
    console.log('[HomeScreen] Attention needed card pressed:', id);
  };

  const handleSchemePress = (id: string) => {
    console.log('[HomeScreen] Eligible scheme card pressed:', id);
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
    setTimeout(async () => {
      const file = await captureWithCamera();
      if (file) handleFileSelected(file);
    }, 300);
  }, [handleFileSelected]);

  const handleUploadPdf = useCallback(async () => {
    setIsSheetOpen(false);
    setTimeout(async () => {
      const file = await pickPdfDocument();
      if (file) handleFileSelected(file);
    }, 300);
  }, [handleFileSelected]);

  const handleUploadImage = useCallback(async () => {
    setIsSheetOpen(false);
    setTimeout(async () => {
      const file = await pickFromGallery();
      if (file) handleFileSelected(file);
    }, 300);
  }, [handleFileSelected]);

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
        <Greeting userName={displayName} currentDate={MOCK_DATE} />

        {/* Health Score Card */}
        <HealthScoreCard data={MOCK_HEALTH_SCORE} />

        {/* Overview Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OVERVIEW</Text>
        </View>
        <View style={styles.overviewGrid}>
          {MOCK_OVERVIEW.map((item, index) => (
            <OverviewCard
              key={item.id}
              item={item}
              isFirst={index === 0}
              isLast={index === MOCK_OVERVIEW.length - 1}
              onPress={() => handleOverviewPress(item.id)}
            />
          ))}
        </View>

        {/* Attention Needed Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleDark}>ATTENTION NEEDED</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/docs' as any)}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        {MOCK_ALERTS.map((alert) => (
          <AlertDocumentCard
            key={alert.id}
            item={alert}
            onPress={() => handleAlertPress(alert.id)}
          />
        ))}

        {/* Eligible Schemes Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleDark}>ELIGIBLE SCHEMES</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/schemes' as any)}>
            <Text style={styles.seeAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        {MOCK_SCHEMES.map((scheme) => (
          <SchemeCard
            key={scheme.id}
            item={scheme}
            onPress={() => handleSchemePress(scheme.id)}
          />
        ))}

        {/* Quick Actions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleDark}>QUICK ACTIONS</Text>
        </View>
        {MOCK_QUICK_ACTIONS.map((action) => (
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
