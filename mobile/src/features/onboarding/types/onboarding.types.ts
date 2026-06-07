export type IllustrationThemeType = 'vault' | 'verification' | 'sync';

export interface OnboardingSlideData {
  id: string;
  title: string;
  description: string;
  illustrationTheme: IllustrationThemeType;
}
