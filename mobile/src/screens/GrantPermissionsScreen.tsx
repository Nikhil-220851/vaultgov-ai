import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  StatusBar,
  Alert,
  Linking,
  AppState,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PermissionCard } from '@/components/PermissionCard';
import { colors } from '@/theme/colors';
import { Camera } from 'expo-camera';
import Constants, { AppOwnership } from 'expo-constants';
import * as MediaLibrary from 'expo-media-library/legacy';

const isExpoGo = Constants.appOwnership === AppOwnership.Expo;
// Conditionally require expo-notifications only if NOT running in Expo Go.
// This prevents load-time crashes in Expo Go where push notification modules are not supported.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = !isExpoGo ? require('expo-notifications') : null;



// ─── Toast helper ────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(message);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setToast(null);
    });
  }, [opacity]);

  return { toast, opacity, show };
}
// ─────────────────────────────────────────────────────────────────────────────

export function GrantPermissionsScreen() {
  const router = useRouter();
  const { toast, opacity: toastOpacity, show: showToast } = useToast();

  // ── Permission granted state ──────────────────────────────────────────────
  const [cameraEnabled, setCameraEnabled]             = useState(false);
  const [storageEnabled, setStorageEnabled]           = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // ── Per-permission loading state ──────────────────────────────────────────
  const [cameraLoading, setCameraLoading]             = useState(false);
  const [storageLoading, setStorageLoading]           = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const allGranted = cameraEnabled && storageEnabled && notificationsEnabled;

  // ── Show permanently denied alert with Settings link ─────────────────────
  const showPermanentlyDeniedAlert = () => {
    Alert.alert(
      'Permission Permanently Denied',
      'This permission has been permanently denied. Please enable it in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const checkAllPermissions = useCallback(async () => {
    try {
      const cameraRes = await Camera.getCameraPermissionsAsync();
      setCameraEnabled(cameraRes.granted);

      if (!isExpoGo) {
        const [storageRes, notificationsRes] = await Promise.all([
          MediaLibrary.getPermissionsAsync(false, ['photo', 'video']),
          Notifications.getPermissionsAsync(),
        ]);
        setStorageEnabled(storageRes.granted);
        setNotificationsEnabled(notificationsRes.granted);
      }
    } catch (error) {
      console.error('[GrantPermissions] Error checking permissions:', error);
    }
  }, []);

  // ── On mount: check existing state; recheck on foreground ─────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAllPermissions();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkAllPermissions();
      }
    });

    return () => sub.remove();
  }, [checkAllPermissions]);

  // ── Camera toggle ─────────────────────────────────────────────────────────
  const handleCameraToggle = async (value: boolean) => {
    // Already granted – do nothing
    if (cameraEnabled) return;
    // User is trying to turn it OFF while it's already OFF – ignore
    if (!value) return;

    setCameraLoading(true);
    try {
      const statusObj = await Camera.getCameraPermissionsAsync();

      if (statusObj.status === 'denied' && !statusObj.canAskAgain) {
        showPermanentlyDeniedAlert();
        return;
      }

      const reqObj = await Camera.requestCameraPermissionsAsync();
      if (reqObj.granted) {
        setCameraEnabled(true);
        showToast('✓ Camera Enabled');
      } else {
        setCameraEnabled(false);
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to scan Aadhaar, PAN and other government documents.'
        );
      }
    } catch (err) {
      console.error('[GrantPermissions] Camera error:', err);
    } finally {
      setCameraLoading(false);
    }
  };

  // ── Storage toggle ────────────────────────────────────────────────────────
  const handleStorageToggle = async (value: boolean) => {
    if (storageEnabled) return;
    if (!value) return;

    if (isExpoGo) {
      Alert.alert(
        'Storage Support',
        'Storage permissions require an Expo Development Build.'
      );
      setStorageEnabled(true);
      showToast('✓ Storage Skipped');
      return;
    }

    setStorageLoading(true);
    try {
      const statusObj = await MediaLibrary.getPermissionsAsync(false, ['photo', 'video']);

      if (statusObj.status === 'denied' && !statusObj.canAskAgain) {
        showPermanentlyDeniedAlert();
        return;
      }

      const reqObj = await MediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);
      if (reqObj.granted) {
        setStorageEnabled(true);
        showToast('✓ Storage Enabled');
      } else {
        setStorageEnabled(false);
      }
    } catch (err) {
      console.error('[GrantPermissions] Storage error:', err);
    } finally {
      setStorageLoading(false);
    }
  };

  // ── Notifications toggle ──────────────────────────────────────────────────
  const handleNotificationsToggle = async (value: boolean) => {
    if (notificationsEnabled) return;
    if (!value) return;

    if (isExpoGo) {
      Alert.alert(
        'Notification Support',
        'Notification permissions require an Expo Development Build.'
      );
      setNotificationsEnabled(true);
      showToast('✓ Notifications Skipped');
      return;
    }

    setNotificationsLoading(true);
    try {
      const statusObj = await Notifications.getPermissionsAsync();

      if (statusObj.status === 'denied' && !statusObj.canAskAgain) {
        showPermanentlyDeniedAlert();
        return;
      }

      const reqObj = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      if (reqObj.granted) {
        setNotificationsEnabled(true);
        showToast('✓ Notifications Enabled');
      } else {
        setNotificationsEnabled(false);
      }
    } catch (err) {
      console.error('[GrantPermissions] Notifications error:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleContinue = () => {
    if (allGranted) {
      router.replace('/explore' as any);
    }
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
            description="Capture Aadhaar, PAN and other government documents using secure OCR."
            value={cameraEnabled}
            onValueChange={handleCameraToggle}
            loading={cameraLoading}
          />
          <View style={styles.cardSeparator} />
          <PermissionCard
            iconName="folder-open-outline"
            title="Storage"
            description={isExpoGo ? "Storage permissions require an Expo Development Build." : "Select existing PDFs and document images securely from your device."}
            value={storageEnabled}
            onValueChange={handleStorageToggle}
            loading={storageLoading}
          />
          <View style={styles.cardSeparator} />
          <PermissionCard
            iconName="notifications-outline"
            title="Notifications"
            description={Constants.appOwnership === AppOwnership.Expo ? "Notification permissions require an Expo Development Build." : "Receive reminders for document expiry, application updates, and new government schemes."}
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            loading={notificationsLoading}
          />
        </View>
      </View>

      {/* Bottom Continue Button */}
      <View style={styles.buttonContainer}>
        {!allGranted && (
          <Text style={styles.helperText}>
            Grant all required permissions to continue.
          </Text>
        )}
        <Pressable
          disabled={!allGranted}
          style={({ pressed }) => [
            styles.button,
            !allGranted && styles.buttonDisabled,
            pressed && allGranted && { opacity: 0.85 },
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue →</Text>
        </Pressable>
      </View>

      {/* Success Toast Overlay */}
      {toast !== null && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
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
  cardSeparator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginHorizontal: 4,
  },
  buttonContainer: {
    marginTop: 24,
  },
  helperText: {
    fontSize: 13,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.black, // #000000
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
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white, // #FFFFFF
  },
  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default GrantPermissionsScreen;
