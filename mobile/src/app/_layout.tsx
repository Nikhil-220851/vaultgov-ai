import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UserProvider, useUser } from '@/context/UserContext';
import { useNotificationStore } from '@/store/useNotificationStore';
import { NotificationProvider } from '@/context/NotificationProvider';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

function RootLogic() {
  const { user } = useUser();
  const router = useRouter();
  const startPolling = useNotificationStore((state) => state.startPolling);
  const stopPolling = useNotificationStore((state) => state.stopPolling);

  useEffect(() => {
    if (user) {
      // User is authenticated, start notification polling
      startPolling();
    } else {
      // User is not authenticated or logged out
      stopPolling();
    }
  }, [user, startPolling, stopPolling]);

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <UserProvider>
            <NotificationProvider>
              <RootLogic />
            </NotificationProvider>
          </UserProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

