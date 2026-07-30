import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { UserProvider, useUser } from '@/context/UserContext';
import { useNotificationStore } from '@/store/useNotificationStore';
import { NotificationProvider } from '@/context/NotificationProvider';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useEffect, ReactNode } from 'react';

function NotificationBootstrap({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const startPolling = useNotificationStore((state) => state.startPolling);
  const stopPolling = useNotificationStore((state) => state.stopPolling);

  // Gate notification handlers until navigation is ready
  const isNavigationReady = rootNavigationState?.key != null;

  useEffect(() => {
    if (!isNavigationReady) return;

    let unsubscribeNotifications: (() => void) | undefined;

    if (user) {
      startPolling();
      unsubscribeNotifications = pushNotificationService.setupNotificationHandlers(router);
      pushNotificationService.registerForPushNotificationsAsync();
    } else {
      stopPolling();
    }

    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [user, router, isNavigationReady, startPolling, stopPolling]);

  return <>{children}</>;
}

function AuthBootstrap({ children }: { children: ReactNode }) {
  // Passthrough for now. In the future, this can listen to auth events independently.
  return <>{children}</>;
}

function NavigationRoot({ children }: { children: ReactNode }) {
  // Logical wrapper representing the boundary between Providers and Router logic
  return <>{children}</>;
}

function AppProviders({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <UserProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </UserProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <NavigationRoot>
        <NotificationBootstrap>
          <AuthBootstrap>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
          </AuthBootstrap>
        </NotificationBootstrap>
      </NavigationRoot>
    </AppProviders>
  );
}

