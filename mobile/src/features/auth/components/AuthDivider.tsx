import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/auth.styles';

export function AuthDivider() {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}
