import { Platform } from 'react-native';

export const Typography = {
  fontFamilies: {
    sans: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif',
      web: 'Inter, Poppins, -apple-system, sans-serif',
      default: 'System',
    }),
    heading: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      web: 'Poppins, Inter, -apple-system, sans-serif',
      default: 'System',
    }),
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    caption: 13,
    subtitle: 15,
    section: 18,
    medium: 24,
    large: 32,
    xxl: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
    caption: 18,
    subtitle: 20,
    section: 24,
    medium: 32,
    large: 40,
  },
} as const;

export type AppTypographyType = typeof Typography;

// Preserved splash screen typography mappings
export const typography = {
  fontFamily: {
    title: Typography.fontFamilies.heading || 'System',
    regular: Typography.fontFamilies.sans || 'System',
  },
  sizes: {
    title: 30, // Specified splash title size
    subtitle: Typography.sizes.subtitle, // 15
    body: Typography.sizes.caption, // 13
    bottom: Typography.sizes.caption, // 13
  },
  weights: {
    bold: Typography.weights.bold,
    regular: Typography.weights.regular,
  },
};
