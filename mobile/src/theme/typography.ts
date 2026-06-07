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
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
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
    lg: 26,
    xl: 28,
    xxl: 32,
    xxxl: 36,
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
    subtitle: Typography.sizes.sm, // 14
    body: Typography.sizes.xs, // 12
    bottom: Typography.sizes.xs, // 12
  },
  weights: {
    bold: Typography.weights.bold,
    regular: Typography.weights.regular,
  },
};
