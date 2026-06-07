import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface AppLogoProps {
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 90 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <FontAwesome6 name="landmark" size={40} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
});
