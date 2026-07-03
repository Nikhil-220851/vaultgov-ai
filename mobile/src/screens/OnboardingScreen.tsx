import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export const OnboardingScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        {/* Shield Icon Container */}
        <View style={styles.iconContainer}>
          <FontAwesome6 name="shield-halved" size={56} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Secure Intelligence</Text>

        {/* Description */}
        <Text style={styles.description}>
          Access and organize your official credentials and government documents with absolute trust and state-of-the-art security.
        </Text>
      </View>

      {/* Button footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconContainer: {
    marginBottom: 32,
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 28,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  title: {
    fontFamily: typography.fontFamily.title,
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  footer: {
    paddingVertical: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  buttonText: {
    fontFamily: typography.fontFamily.title,
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});
