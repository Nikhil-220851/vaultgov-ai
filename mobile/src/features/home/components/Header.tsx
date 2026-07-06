import React, { useState } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Radius, Typography } from '@/theme';

interface HeaderProps {
  avatarInitials: string;
  onPressAvatar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ avatarInitials, onPressAvatar }) => {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AppHeader
      showLogo={true}
      backgroundColor="#F7F8F5"
      borderBottomColor="transparent"
      rightElement={
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            accessibilityLabel="User profile avatar"
            accessibilityRole="button"
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPressAvatar}
            style={styles.avatarPressable}
          >
            <Animated.View style={styles.avatarContainer}>
              <Animated.Text style={styles.avatarText}>{avatarInitials}</Animated.Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      }
    />
  );
};

const styles = StyleSheet.create({
  avatarPressable: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.darkGray,
  },
});

export default Header;
