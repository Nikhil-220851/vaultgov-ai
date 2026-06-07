import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '@/theme';

export function GoogleIcon() {
  return (
    <View style={styles.container}>
      <Text style={styles.letter}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 18,
    fontWeight: '700',
    color: '#5F6368', // Elegant Google-style neutral dark gray
    textAlign: 'center',
  },
});
