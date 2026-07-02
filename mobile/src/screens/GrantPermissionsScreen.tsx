import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PermissionCard } from '@/components/PermissionCard';
import { colors } from '@/theme/colors';

export function GrantPermissionsScreen() {
  const router = useRouter();

  // Local state for the permission switches
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [storageEnabled, setStorageEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleContinue = () => {
    // Navigate to the main application page
    router.replace('/(tabs)/home' as any);
  };

  return (
    <ScreenContainer safeAreaStyle={styles.safeArea} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.topSection}>
        {/* Uppercase Small Text */}
        <Text style={styles.preTitle}>ALMOST THERE</Text>
        
        {/* Main Heading */}
        <Text style={styles.heading}>Grant permissions</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          We need these permissions to give you the best experience.
        </Text>
        
        {/* Divider */}
        <View style={styles.divider} />

        {/* Cards list */}
        <View style={styles.cardsContainer}>
          <PermissionCard
            iconName="camera-outline"
            title="Camera"
            description="Scan docs via OCR"
            value={cameraEnabled}
            onValueChange={setCameraEnabled}
          />
          <PermissionCard
            iconName="folder-open-outline"
            title="Storage"
            description="Upload PDFs & images"
            value={storageEnabled}
            onValueChange={setStorageEnabled}
          />
          <PermissionCard
            iconName="notifications-outline"
            title="Notifications"
            description="Get alerts & updates"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>
      </View>

      {/* Bottom Continue Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue →</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
  },
  preTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.primary, // #1977F3
    marginBottom: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black, // #000000
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.darkGray, // #707070
    lineHeight: 22,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginBottom: 16,
  },
  cardsContainer: {
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    backgroundColor: colors.black, // #000000 (VaultGov dark theme color)
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white, // #FFFFFF
  },
});

export default GrantPermissionsScreen;
