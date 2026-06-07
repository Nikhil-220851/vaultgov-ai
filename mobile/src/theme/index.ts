import { Colors } from './colors';
import { Spacing } from './spacing';
import { Typography } from './typography';
import { Radius } from './radius';

export { Colors, Spacing, Typography, Radius };

export const theme = {
  colors: Colors,
  spacing: Spacing,
  typography: Typography,
  radius: Radius,
} as const;

export type ThemeType = typeof theme;
