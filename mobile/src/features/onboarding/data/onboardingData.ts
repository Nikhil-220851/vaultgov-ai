import { OnboardingSlideData } from '../types/onboarding.types';

export const onboardingSlides: OnboardingSlideData[] = [
  {
    id: '1',
    title: 'Store all documents safely in one place',
    description: 'Keep all your government documents in a single secure vault.',
    illustrationTheme: 'vault',
  },
  {
    id: '2',
    title: 'Instant verification anytime',
    description: 'Verify certificates and identity documents in seconds.',
    illustrationTheme: 'verification',
  },
  {
    id: '3',
    title: 'Access anywhere securely',
    description: 'Your documents stay protected and available across all devices.',
    illustrationTheme: 'sync',
  },
];
export type OnboardingSlidesType = typeof onboardingSlides;
