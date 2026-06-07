import React from 'react';
import { StyleSheet, View } from 'react-native';

export function ArrowIcon() {
  return (
    <View style={styles.container}>
      <View style={styles.shaft} />
      <View style={styles.head} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shaft: {
    width: 10,
    height: 1.5,
    backgroundColor: '#8E8E93', // Muted thin arrow color
    borderRadius: 1,
    position: 'absolute',
  },
  head: {
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#8E8E93',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    right: 2,
  },
});
