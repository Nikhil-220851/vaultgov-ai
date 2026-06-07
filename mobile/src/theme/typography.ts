import { Platform } from 'react-native';

export const typography = {
  fontFamily: {
    // SF Pro Display on iOS, clean sans-serif/Roboto on Android/Web
    title: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif-medium',
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sizes: {
    title: 30,
    subtitle: 14,
    body: 12,
    bottom: 12,
  },
  weights: {
    bold: '700' as const,
    regular: '400' as const,
  },
};
