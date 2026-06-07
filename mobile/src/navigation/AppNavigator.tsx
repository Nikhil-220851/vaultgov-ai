import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { OnboardingScreen } from '../features/onboarding';
import AppTabs from '../components/app-tabs';
import { Colors } from '@/theme';

export function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    // Simulate loading onboarding state from storage (e.g. AsyncStorage or expo-secure-store)
    const loadOnboardingState = async () => {
      try {
        // In a fully configured app, you would retrieve this key:
        // const val = await AsyncStorage.getItem('@vaultgov_has_onboarded');
        // if (val === 'true') setHasOnboarded(true);
        
        // Simulating storage retrieval delay for a premium feel
        await new Promise((resolve) => setTimeout(resolve, 600));
        setHasOnboarded(false); // Default to showing onboarding first
      } catch (e) {
        console.error('Failed to load onboarding state:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingState();
  }, []);

  const handleFinishOnboarding = async () => {
    try {
      // In production:
      // await AsyncStorage.setItem('@vaultgov_has_onboarded', 'true');
      setHasOnboarded(true);
    } catch (e) {
      console.error('Failed to save onboarding state:', e);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryBlue} />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  // Once onboarding is completed, show the main application dashboard (tabs)
  return <AppTabs />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
