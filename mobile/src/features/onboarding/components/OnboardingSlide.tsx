import React from 'react';
import { View, Text, Animated } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { styles } from '../styles/onboarding.styles';
import { OnboardingSlideData } from '../types/onboarding.types';
import { VaultIllustration } from './VaultIllustration';
import { VerifyIllustration } from './VerifyIllustration';
import { CloudIllustration } from './CloudIllustration';
import { PaginationDots } from './PaginationDots';

export interface OnboardingSlideProps {
  item: OnboardingSlideData;
  scrollX: Animated.Value;
  totalSlides: number;
}

export function OnboardingSlide({ item, scrollX, totalSlides }: OnboardingSlideProps) {
  const renderIllustration = () => {
    switch (item.illustrationTheme) {
      case 'vault':
        return <VaultIllustration />;
      case 'verification':
        return <VerifyIllustration />;
      case 'sync':
        return <CloudIllustration />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.slideWrapper}>
      <View style={styles.cardContainer}>
        {/* Top Illustration Area */}
        <View style={styles.illustrationArea}>
          {renderIllustration()}
        </View>

        {/* Text Content Area - Animated entering */}
        <Reanimated.View 
          entering={FadeInDown.delay(200).duration(600)} 
          style={styles.textContentContainer}
        >
          <Text style={styles.heading}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Reanimated.View>

        {/* Pagination dots placed inside the card (as in wireframe) */}
        <PaginationDots data={Array(totalSlides).fill(0)} scrollX={scrollX} />
      </View>
    </View>
  );
}
