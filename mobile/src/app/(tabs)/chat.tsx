import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/theme';

export default function ChatRoute() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>VaultGov AI Assistant</Text>
        <Text style={styles.subtitle}>Ask questions about document renewals, schemes, and applications.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.pureBlack,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
