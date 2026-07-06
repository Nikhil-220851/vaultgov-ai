import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DocumentStoreProvider } from '@/features/documents';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <DocumentStoreProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </DocumentStoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
