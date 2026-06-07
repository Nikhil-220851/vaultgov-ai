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

// Preserved splash screen specific design colors
export const colors = {
  primary: '#1977F3',        // Primary Blue
  secondary: '#C8CDE8',      // Secondary Lavender
  accent: '#FF9800',         // Accent Orange
  success: '#3CC556',        // Success Green
  error: '#FF3B30',          // Soft Red
  darkGray: '#707070',       // Dark Gray
  black: '#000000',          // Black
  background: '#F7F8F5',     // Background
  white: '#FFFFFF',
  lightGray: '#EFEFEF',
};
