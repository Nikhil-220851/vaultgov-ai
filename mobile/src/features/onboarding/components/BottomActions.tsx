import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/onboarding.styles';
import { AnimatedPressable } from '@/components/AnimatedPressable';

export interface BottomActionsProps {
  currentIndex: number;
  totalSlides: number;
  onSkip: () => void;
  onNext: () => void;
}

export function BottomActions({
  currentIndex,
  totalSlides,
  onSkip,
  onNext,
}: BottomActionsProps) {
  const isLastSlide = currentIndex === totalSlides - 1;

  return (
    <View style={styles.bottomActionsContainer}>
      {/* Skip Button - styled as grey outlined secondary */}
      <AnimatedPressable
        onPress={onSkip}
        style={[styles.bottomButton, styles.skipButton]}
      >
        <Text style={styles.skipText}>Skip</Text>
      </AnimatedPressable>

      {/* Slide Indicator Text */}
      <Text style={styles.slideInfoText}>
        Slide {currentIndex + 1} of {totalSlides}
      </Text>

      {/* Next / Get Started Button - styled as black primary CTA */}
      <AnimatedPressable
        onPress={onNext}
        style={[styles.bottomButton, styles.nextButton]}
      >
        <Text style={styles.nextText}>
          {isLastSlide ? 'Get Started' : 'Next'}
        </Text>
        {!isLastSlide && <Text style={styles.nextArrow}>→</Text>}
      </AnimatedPressable>
    </View>
  );
}
