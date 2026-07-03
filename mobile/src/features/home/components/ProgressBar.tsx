import React, { useEffect, useState } from 'react';
import { View, Animated } from 'react-native';
import { styles } from '../styles';

interface ProgressBarProps {
  progress: number; // between 0 and 1
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  // useState with lazy initializer: React Compiler-safe, stable across renders
  const [animatedWidth] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false, // width cannot use native driver
    }).start();
  }, [progress, animatedWidth]);

  const widthStyle = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBarTrack}>
      <Animated.View style={[styles.progressBarFill, { width: widthStyle }]} />
    </View>
  );
};

export default ProgressBar;
