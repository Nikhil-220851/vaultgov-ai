import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export default function OcrPlaceholderRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const handleFinish = () => {
    console.log('[OcrPlaceholderScreen] Finish pressed, returning to home');
    router.dismissAll();
  };

  return (
    <ScreenContainer safeAreaStyle={styles.safeArea} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle-outline" size={60} color={Colors.primaryGreen} />
        </View>

        <Text style={styles.title}>Ready for OCR (Phase 2)</Text>
        <Text style={styles.description}>
          The document scanner module has successfully captured and verified the document.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Captured File Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
              {params.name || 'document.jpg'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Source:</Text>
            <Text style={[styles.value, styles.capitalize]}>
              {params.source || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Resolution:</Text>
            <Text style={styles.value}>
              {params.width && params.height ? `${params.width} x ${params.height}` : 'N/A'}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
          onPress={handleFinish}
        >
          <Text style={styles.buttonText}>Return to Home</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
  },
  container: {
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EAFBEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.pureBlack,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    width: '100%',
    marginBottom: 40,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.pureBlack,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: Colors.darkGray,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.pureBlack,
    maxWidth: '70%',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  button: {
    backgroundColor: Colors.pureBlack,
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
