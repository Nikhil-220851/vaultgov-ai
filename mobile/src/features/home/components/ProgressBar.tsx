import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { styles } from '../styles';

interface ProgressBarProps {
  progress: number; // between 0 and 1
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false, // width cannot use native driver
    }).start();
  }, [progress]);

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
