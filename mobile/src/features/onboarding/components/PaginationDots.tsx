import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import { styles } from '../styles/onboarding.styles';
import { Colors } from '@/theme';

export interface PaginationDotsProps {
  data: any[];
  scrollX: Animated.Value;
}

export function PaginationDots({ data, scrollX }: PaginationDotsProps) {
  const { width: windowWidth } = useWindowDimensions();

  return (
    <View style={styles.paginationContainer}>
      {data.map((_, index) => {
        const inputRange = [
          (index - 1) * windowWidth,
          index * windowWidth,
          (index + 1) * windowWidth,
        ];

        // Active dot stretches into a pill shape
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 20, 8],
          extrapolate: 'clamp',
        });

        // Active dot gets higher opacity and shifts to pure black
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: ['#D1D1D6', Colors.pureBlack, '#D1D1D6'],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index.toString()}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
}
