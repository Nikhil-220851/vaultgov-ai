import React from 'react';
import { StyleSheet, View } from 'react-native';

export function PhoneIcon() {
  return (
    <View style={styles.container}>
      <View style={styles.phoneFrame}>
        {/* Top Speaker/Notch */}
        <View style={styles.notch} />
        {/* Bottom Home Button */}
        <View style={styles.homeButton} />
      </View>
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
  phoneFrame: {
    width: 14,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#666666',
    borderRadius: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  notch: {
    width: 4,
    height: 1,
    backgroundColor: '#666666',
    borderRadius: 0.5,
  },
  homeButton: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    borderWidth: 0.8,
    borderColor: '#666666',
  },
});
