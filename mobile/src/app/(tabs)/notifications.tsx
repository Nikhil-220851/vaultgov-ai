import React from 'react';
import { NotificationCenterScreen } from '@/features/notifications/NotificationCenterScreen';
import { Stack } from 'expo-router';

export default function NotificationsTab() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NotificationCenterScreen />
    </>
  );
}
