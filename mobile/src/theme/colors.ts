export const Colors = {
  primaryBlue: '#1677F0',
  softBlue: '#C9D2F0',
  primaryOrange: '#FF9800',
  primaryGreen: '#34C759',
  dangerRed: '#FF3B30',
  softPink: '#F1D0D0',
  darkGray: '#666666',
  pureBlack: '#000000',
  background: '#F8F8F8',
  white: '#FFFFFF',
} as const;

export type AppColorsType = typeof Colors;
