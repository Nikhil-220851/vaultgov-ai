import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius } from '@/theme';

interface CircularScoreProps {
  score: number;
  total: number;
}

export const CircularScore: React.FC<CircularScoreProps> = ({ score, total }) => {
  return (
    <View style={styles.container}>
      {/* Outer border track */}
      <View style={styles.track}>
        {/* Accent indicator segment overlay */}
        <View style={styles.accentArc} />
        {/* Inner core block */}
        <View style={styles.innerCore}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.totalText}>/ {total}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    borderWidth: 6,
    borderColor: '#E6E6E6', // track light grey
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  accentArc: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: Radius.full,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: '#34C759', // success green segments
    borderRightColor: '#34C759',
    transform: [{ rotate: '45deg' }],
  },
  innerCore: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    fontFamily: Typography.fontFamilies.heading,
  },
  totalText: {
    fontSize: 11,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 1,
  },
});

export default CircularScore;
