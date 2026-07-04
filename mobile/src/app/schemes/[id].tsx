import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { getSchemeById } from '@/data/schemes';
import { SchemeDetailsScreen } from '@/screens/SchemeDetailsScreen';
import { colors } from '@/theme/colors';

export default function SchemeDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = getSchemeById(id);

  if (!scheme) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Scheme not found.</Text>
      </View>
    );
  }

  return <SchemeDetailsScreen scheme={scheme} />;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: '#707070',
  },
});
