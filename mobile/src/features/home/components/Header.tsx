import React, { useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { styles } from '../styles';
import { AppLogo } from '@/components/AppLogo';

interface HeaderProps {
  avatarInitials: string;
  onPressAvatar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ avatarInitials, onPressAvatar }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
