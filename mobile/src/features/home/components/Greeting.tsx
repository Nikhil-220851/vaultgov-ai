import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { styles } from '../styles';

interface GreetingProps {
  userName: string;
  currentDate: string;
}

export const Greeting: React.FC<GreetingProps> = React.memo(({ userName, currentDate }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [showEmoji, setShowEmoji] = useState(true);

  useEffect(() => {
    // 4 full wave cycles (8 swings back and forth) + 1 centering swing, then poof fade out.
    // Total duration: 9 * 130ms = 1170ms + 300ms poof = ~1.47s.
    Animated.sequence([
      // Cycle 1
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 130,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: -1,
        duration: 130,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Cycle 2
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 130,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: -1,
        duration: 130,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Cycle 3
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 130,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: -1,
        duration: 130,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Cycle 4
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 130,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: -1,
        duration: 130,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Back to center
      Animated.timing(waveAnim, {
        toValue: 0,
        duration: 130,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Poof / fade-out: scale-down + fade-out to completely disappear
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        setShowEmoji(false);
      }
    });
  }, [waveAnim, scaleAnim, opacityAnim]);

  const rotation = waveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-18deg', '18deg'],
  });

  return (
    <View style={styles.greetingContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.greetingText}>Hello {userName}</Text>
        {showEmoji && (
          <Animated.View
            style={{
              marginLeft: 6,
              opacity: opacityAnim,
              transform: [
                { rotate: rotation },
                { scale: scaleAnim },
              ],
            }}
          >
            <Text style={styles.greetingText}>👋</Text>
          </Animated.View>
        )}
      </View>
      <Text style={styles.dateText}>{currentDate}</Text>
    </View>
  );
});

Greeting.displayName = 'Greeting';

export default Greeting;
