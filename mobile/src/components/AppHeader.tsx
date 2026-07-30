"use no memo";
import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/theme';
import { Avatar } from './Avatar';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  backgroundColor?: string;
  borderBottomColor?: string;
  fullName?: string | null;
  profileImageUrl?: string | null;
  onPressAvatar?: () => void;
}

export function AppHeader({
  title,
  subtitle,
  showLogo = false,
  leftElement,
  rightElement,
  backgroundColor = Colors.background,
  borderBottomColor = '#EBEBEB',
  fullName,
  profileImageUrl,
  onPressAvatar,
}: AppHeaderProps) {
  return (
    <View style={[styles.header, { backgroundColor, borderBottomColor }]}>
      <View style={styles.left}>
        {showLogo ? (
          <View style={styles.logoRow}>
            <View style={styles.logoIconWrap}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.primaryBlue} />
            </View>
            <Text style={styles.logoText}>VaultGov</Text>
          </View>
        ) : (
          leftElement
        )}
      </View>

      <View style={styles.center}>
        {title ? (
          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        ) : null}
      </View>

      <View style={styles.right}>
        {fullName !== undefined || profileImageUrl !== undefined ? (
          <Avatar
            fullName={fullName}
            profileImageUrl={profileImageUrl}
            size={36}
            onPress={onPressAvatar}
          />
        ) : (
          rightElement
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  left: {
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  right: {
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#D4E2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    letterSpacing: -0.5,
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.sizes.section,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    fontFamily: Typography.fontFamilies.heading,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 1,
    textAlign: 'center',
  },
});
