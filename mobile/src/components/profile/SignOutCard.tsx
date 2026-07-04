"use no memo";
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface SignOutCardProps {
  onSignOut: () => void;
}

export function SignOutCard({ onSignOut }: SignOutCardProps) {
  const handlePress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of VaultGov AI? You will need to verify your mobile number again to sign in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onSignOut,
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.82}>
      <View style={styles.iconWrap}>
        <Ionicons name="log-out-outline" size={20} color={Colors.dangerRed} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Sign Out</Text>
        <Text style={styles.description}>Sign out from this device</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.dangerRed} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#FFECEB',
    ...Platform.select({
      ios: {
        shadowColor: Colors.dangerRed,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#FFF0EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.dangerRed,
    marginBottom: 2,
  },
  description: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
});
