import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

interface LoadingBarProps {
  duration?: number;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ duration = 2500 }) => {
  const widthPercent = useSharedValue(0);

  useEffect(() => {
    widthPercent.value = withTiming(1, {
      duration: duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [duration, widthPercent]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${widthPercent.value * 100}%`,
    };
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 160,
    height: 6,
    backgroundColor: colors.secondary, // Secondary Lavender track
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary, // Primary Blue fill
    borderRadius: 999,
  },
});
