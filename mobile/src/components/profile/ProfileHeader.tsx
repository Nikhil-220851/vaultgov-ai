"use no memo";
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface ProfileHeaderProps {
  name: string;
  phone: string;
  email?: string;
  avatarInitials: string;
  isVerified: boolean;
  onEditPress: () => void;
  onSettingsPress: () => void;
}

export function ProfileHeader({
  name,
  phone,
  email,
  avatarInitials,
  isVerified,
  onEditPress,
  onSettingsPress,
}: ProfileHeaderProps) {
  const [editScale] = useState(() => new Animated.Value(1));

  const handleEditPressIn = () => {
    Animated.timing(editScale, {
      toValue: 0.95,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handleEditPressOut = () => {
    Animated.timing(editScale, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoIconWrap}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.primaryBlue} />
          </View>
          <Text style={styles.logoText}>VaultGov</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={onSettingsPress}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.primaryBlue} />
        </TouchableOpacity>
      </View>

      {/* Avatar + Info row */}
      <View style={styles.profileRow}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {isVerified && (
              <View style={styles.verifiedPill}>
                <Ionicons name="shield-checkmark" size={10} color={Colors.primaryBlue} />
                <Text style={styles.verifiedPillText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.phone}>{phone}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>
      </View>

      {/* Edit Profile Button */}
      <Animated.View style={{ transform: [{ scale: editScale }] }}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={onEditPress}
          onPressIn={handleEditPressIn}
          onPressOut={handleEditPressOut}
          activeOpacity={1}
        >
          <Ionicons name="pencil-outline" size={14} color={Colors.primaryBlue} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#D4E2FD',
    ...Platform.select({
      ios: {
        shadowColor: '#1977F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4E2FD',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  avatarText: {
    fontSize: 26,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    letterSpacing: -0.3,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D4E2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
  },
  phone: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
    marginBottom: 2,
  },
  email: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.primaryBlue,
    borderRadius: Radius.button,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
  },
});
