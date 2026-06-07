import React from 'react';
import { useRouter } from 'expo-router';
import { SplashScreen } from '../screens/SplashScreen';

export default function AppEntry() {
  const router = useRouter();

  const handleFinish = () => {
    router.replace('/onboarding' as any);
  };

  return <SplashScreen onFinish={handleFinish} />;
}
