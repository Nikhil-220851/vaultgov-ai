import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface AppLogoProps {
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 90 }) => {
  const borderRadius = size * 0.25;
  
  // Icon and badge dimensions proportional to logo size
  const shieldSize = size * 0.58;
  const buildingSize = size * 0.30;
  const badgeSize = size * 0.24;
  const lockIconSize = size * 0.13;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius }]}>
      {/* Subtle tech background circle for depth */}
      <View 
        style={[
          styles.bgCircle, 
          { 
            width: size * 0.85, 
            height: size * 0.85, 
            borderRadius: (size * 0.85) / 2 
          }
        ]} 
      />
      
      {/* Main secure shield */}
      <View style={styles.iconWrapper}>
        <FontAwesome6 name="shield" size={shieldSize} color={colors.primary} />
        
        {/* Government Building (Landmark) inside the shield */}
        <View style={[styles.buildingWrapper, { bottom: size * 0.035 }]}>
          <FontAwesome6 name="landmark" size={buildingSize} color={colors.white} />
        </View>
        
        {/* Secure Lock badge overlap at the bottom right */}
        <View 
          style={[
            styles.lockBadge, 
            { 
              width: badgeSize, 
              height: badgeSize, 
              borderRadius: badgeSize / 2,
              right: size * 0.08,
              bottom: size * 0.08,
            }
          ]}
        >
          <FontAwesome6 name="lock" size={lockIconSize} color={colors.white} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E8F0',
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
  bgCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(25, 119, 243, 0.06)',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  buildingWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
  },
  lockBadge: {
    position: 'absolute',
    backgroundColor: colors.accent, // Accent orange
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
