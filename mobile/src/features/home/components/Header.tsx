import React, { useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { styles } from '../styles';
import { AppLogo } from '@/components/AppLogo';

interface HeaderProps {
  avatarInitials: string;
  onPressAvatar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ avatarInitials, onPressAvatar }) => {
  // useState with lazy initializer is the React Compiler-safe way to create a
  // stable Animated.Value – avoids the react-hooks/refs violation of .current in render.
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
    <View style={styles.headerContainer}>
      <View style={[styles.headerLeft, { flexDirection: 'row', alignItems: 'center' }]}>
        <AppLogo size={32} />
        <View style={{ width: 8 }} />
        <Text style={styles.logoText}>VaultGov</Text>
      </View>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          accessibilityLabel="User profile avatar"
          accessibilityRole="button"
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPressAvatar}
          style={styles.avatarPressable}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default Header;
