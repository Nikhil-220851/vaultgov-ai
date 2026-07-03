import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export const HomeScreen: React.FC = () => {
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
  };

  const handleAlertPress = (id: string) => {
    console.log('[HomeScreen] Attention needed card pressed:', id);
  };

  const handleSchemePress = (id: string) => {
    console.log('[HomeScreen] Eligible scheme card pressed:', id);
  };

  const handleQuickActionPress = (id: string) => {
    console.log('[HomeScreen] Quick action card pressed:', id);
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
          <Text style={styles.seeAllText}>See all</Text>
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
          <Text style={styles.seeAllText}>View all</Text>
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
