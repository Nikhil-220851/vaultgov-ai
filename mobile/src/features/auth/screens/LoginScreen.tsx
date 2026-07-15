import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
  Text,
  StatusBar,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AuthButton } from '../components/AuthButton';
import { AuthDivider } from '../components/AuthDivider';
import { useGoogleAuth } from '@/services/authService';
import { usePostAuthRedirect } from '@/hooks/usePostAuthRedirect';
import { styles } from '../styles/auth.styles';

export function LoginScreen() {
  const router = useRouter();
  const { request, signIn } = useGoogleAuth();
  const postAuthRedirect = usePostAuthRedirect();

  const [googleLoading, setGoogleLoading] = useState(false);
  const isLoggingInRef = React.useRef(false);

  // ─── Google OAuth ────────────────────────────────────────────────────────────

  const handleGoogleLogin = async () => {
    if (isLoggingInRef.current) {
      console.log('[LoginScreen] Google login already in progress. Ignoring tap.');
      return;
    }
    
    isLoggingInRef.current = true;
    setGoogleLoading(true);

    try {
      const user = await signIn();

      if (user) {
        console.log('[LoginScreen] Authenticated user:', {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        });

        // Smart redirect (fetches/upserts user profile and routes correctly)
        await postAuthRedirect(user);
      } else {
        // User cancelled or an error occurred — already logged in the service
        console.log('[LoginScreen] Google sign-in did not complete.');
        isLoggingInRef.current = false;
        setGoogleLoading(false);
      }

    } catch (error) {
      // Defensive catch — individual errors are already handled inside useGoogleAuth
      console.error('[LoginScreen] Unexpected error during Google login:', error);
      isLoggingInRef.current = false;
      setGoogleLoading(false);
    }
    // We intentionally don't set loading to false here if successful, 
    // because postAuthRedirect will unmount this screen.
  };

  // ─── OTP Flow (unchanged) ────────────────────────────────────────────────────

  const handleOtpLogin = () => {
    router.push('/mobile-number' as any);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer safeAreaStyle={{ backgroundColor: '#F7F8F5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8F5" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View style={styles.headerSection}>

              {/* Center Icon Card — government temple built from pure Views */}
              <View style={styles.logoCard}>
                <View style={styles.buildingIconContainer}>
                  <View style={styles.buildingRoof} />
                  <View style={styles.buildingArchitrave} />
                  <View style={styles.buildingColumnsContainer}>
                    <View style={styles.buildingColumn} />
                    <View style={styles.buildingColumn} />
                    <View style={styles.buildingColumn} />
                  </View>
                  <View style={styles.buildingBaseTop} />
                  <View style={styles.buildingBaseBottom} />
                </View>
              </View>

              <Text style={styles.title}>Welcome to VaultGov</Text>
              <Text style={styles.subtitle}>
                Your personal government document assistant
              </Text>
            </View>

            {/* ── Auth Buttons ────────────────────────────────────────────────── */}
            <View style={styles.buttonSection}>
              <AuthButton
                title="Continue with Google"
                iconType="google"
                onPress={handleGoogleLogin}
                loading={googleLoading}
                // Disable button until expo-auth-session has built the request object
                disabled={!request || googleLoading}
              />

              <AuthDivider />

              <AuthButton
                title="Continue with OTP"
                iconType="otp"
                onPress={handleOtpLogin}
                loading={false}
                disabled={googleLoading}
              />
            </View>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>By continuing you agree to our</Text>
              <View style={styles.footerLinks}>
                <Pressable
                  style={({ pressed }) => [
                    styles.footerLink,
                    pressed && { opacity: 0.6 },
                  ]}
                  onPress={() => {
                    // TODO: Deep link to Terms of Service
                    console.log('[Footer] Navigate to Terms of Service');
                  }}
                >
                  <Text style={styles.footerLinkText}>Terms of Service</Text>
                </Pressable>

                <Text style={styles.footerSeparator}>·</Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.footerLink,
                    pressed && { opacity: 0.6 },
                  ]}
                  onPress={() => {
                    // TODO: Deep link to Privacy Policy
                    console.log('[Footer] Navigate to Privacy Policy');
                  }}
                >
                  <Text style={styles.footerLinkText}>Privacy Policy</Text>
                </Pressable>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

export default LoginScreen;
