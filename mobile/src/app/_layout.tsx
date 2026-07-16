import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UserProvider } from '@/context/UserContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <UserProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

