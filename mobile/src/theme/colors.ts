export const Colors = {
  primaryBlue: '#1977F3',
  softBlue: '#C8CDE8',
  primaryOrange: '#FF9800',
  primaryGreen: '#3CC556',
  dangerRed: '#FF3B30',
  error: '#FF3B30',
  softPink: '#F1D0D0',
  darkGray: '#707070',
  pureBlack: '#000000',
  background: '#F7F8F5',
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
