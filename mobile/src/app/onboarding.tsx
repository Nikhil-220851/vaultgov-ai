import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../features/onboarding';

export default function OnboardingPage() {
  const router = useRouter();

  const handleFinish = () => {
    // After onboarding is complete, navigate to the Login screen.
    router.replace('/login' as any);
  };

  return <OnboardingScreen onFinish={handleFinish} />;
}
