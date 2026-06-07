export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  button: 14, // Exact requirement for buttons
  card: 24,   // Exact requirement for card containers
  full: 9999,
} as const;

export type AppRadiusType = typeof Radius;
