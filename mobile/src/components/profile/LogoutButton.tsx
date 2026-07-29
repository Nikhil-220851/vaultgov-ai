"use no memo";
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface LogoutButtonProps {
  onSignOut: () => void;
}

export function LogoutButton({ onSignOut }: LogoutButtonProps) {
  const handlePress = () => {
    Alert.alert(
      'Log out?',
      'Are you sure you want to log out of VaultGov AI?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onSignOut,
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <Ionicons name="log-out-outline" size={20} color={Colors.white} />
      <Text style={styles.buttonText}>Log Out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.dangerRed,
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginLeft: Spacing.sm,
  },
});
