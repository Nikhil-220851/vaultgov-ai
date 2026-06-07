export const Spacing = {
  xs: 4,      // 4pt
  sm: 8,      // 8pt
  md: 16,     // 16pt
  lg: 24,     // 24pt
  xl: 32,     // 32pt
  xxl: 40,    // 40pt
  xxxl: 48,   // 48pt
} as const;

export type AppSpacingType = typeof Spacing;
