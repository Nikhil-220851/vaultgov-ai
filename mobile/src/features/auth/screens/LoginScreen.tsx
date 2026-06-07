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
import { AuthService } from '../services/auth.service';
import { styles } from '../styles/auth.styles';

export function LoginScreen() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (googleLoading || otpLoading) return;
    setGoogleLoading(true);
    try {
      const response = await AuthService.signInWithGoogle();
      if (response.success) {
        // Redirect to explore upon successful sign-in
        router.replace('/explore' as any);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleOtpSignIn = () => {
    router.push('/mobile-number' as any);
  };

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
            {/* Header Section */}
            <View style={styles.headerSection}>
              {/* Center Icon Card */}
              <View style={styles.logoCard}>
                {/* Government temple logo built from pure React Native Views */}
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

              {/* App Title */}
              <Text style={styles.title}>Welcome to VaultGov</Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Your personal government document assistant
              </Text>
            </View>

            {/* Auth Buttons Section */}
            <View style={styles.buttonSection}>
              <AuthButton
                title="Continue with Google"
                iconType="google"
                onPress={handleGoogleSignIn}
                loading={googleLoading}
                disabled={otpLoading}
              />

              <AuthDivider />

              <AuthButton
                title="Continue with OTP"
                iconType="otp"
                onPress={handleOtpSignIn}
                loading={otpLoading}
                disabled={googleLoading}
              />
            </View>

            {/* Footer Agreements */}
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
                    console.log('Navigate to Terms of Service');
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
                    console.log('Navigate to Privacy Policy');
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
