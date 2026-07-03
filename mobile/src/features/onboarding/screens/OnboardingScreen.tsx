import React, { useRef, useState } from 'react';
import { View, FlatList, Animated, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { styles } from '../styles/onboarding.styles';
import { onboardingSlides } from '../data/onboardingData';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { BottomActions } from '../components/BottomActions';
import { ScreenContainer } from '@/components/ScreenContainer';

export interface OnboardingScreenProps {
  onFinish: () => void;
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));
  const flatListRef = useRef<FlatList>(null);
  const { width: windowWidth } = useWindowDimensions();

  // Track the scroll position to pass to the dots animation
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false } // Must be false because width/color interpolations don't support native driver
  );

  // Sync index on manual swipe/scroll
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / windowWidth);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  return (
    <ScreenContainer style={styles.screenContainer} safeAreaStyle={{ backgroundColor: '#F8F8F8' }}>
      {/* Slide Carousel Container */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={onboardingSlides}
          renderItem={({ item }) => (
            <OnboardingSlide
              item={item}
              scrollX={scrollX}
              totalSlides={onboardingSlides.length}
            />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          snapToAlignment="center"
          decelerationRate="fast"
        />
      </View>

      {/* Bottom Navigation Actions */}
      <BottomActions
        currentIndex={currentIndex}
        totalSlides={onboardingSlides.length}
        onSkip={handleSkip}
        onNext={handleNext}
      />
    </ScreenContainer>
  );
}
export default OnboardingScreen;
