"use no memo";
import React, { useState, useEffect } from 'react';
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
import { Avatar } from '../Avatar';

interface ProfileHeaderProps {
  name: string;
  phone: string;
  email?: string;
  profileImageUrl?: string | null;
  isVerified: boolean;
  onEditPress?: () => void;
  onEditAvatarPress?: () => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 18) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

export function ProfileHeader({
  name,
  phone,
  email,
  profileImageUrl,
  isVerified,
  onEditPress,
  onEditAvatarPress,
}: ProfileHeaderProps) {
  const [editScale] = useState(() => new Animated.Value(1));
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

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
      <Text style={styles.greeting}>{greeting}</Text>
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            <Avatar 
              fullName={name} 
              profileImageUrl={profileImageUrl} 
              size={64} 
              onPress={onEditAvatarPress}
              showEditBadge={!!onEditAvatarPress}
            />
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
            <Text style={styles.contactText}>{phone}</Text>
            {email && <Text style={styles.contactText}>{email}</Text>}
          </View>
        </View>

        {onEditPress && (
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
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
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
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
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: Typography.sizes.lg,
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
  contactText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
    marginBottom: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.md,
    paddingVertical: 10,
  },
  editBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
  },
});
