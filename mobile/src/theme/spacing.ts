export const Spacing = {
  xxs: 4,     // 4pt
  xs: 8,      // 8pt
  sm: 12,     // 12pt
  md: 16,     // 16pt
  lg: 20,     // 20pt
  xl: 24,     // 24pt
  xxl: 32,    // 32pt
  xxxl: 40,   // 40pt
} as const;

export type AppSpacingType = typeof Spacing;
