import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography } from '@/theme';

export interface AvatarProps {
  fullName?: string | null;
  profileImageUrl?: string | null;
  size?: number;
  style?: ViewStyle;
  onPress?: () => void;
  showEditBadge?: boolean;
}

export function Avatar({
  fullName,
  profileImageUrl,
  size = 40,
  style,
  onPress,
  showEditBadge = false,
}: AvatarProps) {
  // Generate initials from fullName
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(fullName);
  const borderRadius = size / 2;

  const content = (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius },
        style,
      ]}
    >
      {profileImageUrl ? (
        <Image
          source={{ uri: profileImageUrl }}
          style={{ width: size, height: size, borderRadius }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: size * 0.4 },
          ]}
        >
          {initials}
        </Text>
      )}

      {showEditBadge && (
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>EDIT</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D4E2FD', // Same as previous avatar background
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontFamily: Typography.fontFamilies.sans,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryBlue,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: '100%',
    paddingVertical: 4,
    alignItems: 'center',
  },
  editBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
