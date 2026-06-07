import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../features/onboarding';

export default function OnboardingPage() {
  const router = useRouter();

  const handleFinish = () => {
    // After onboarding is complete, navigate to the main app.
    // Using push so the back gesture is disabled on the stack.
    router.replace('/explore' as any);
  };

  return <OnboardingScreen onFinish={handleFinish} />;
}
