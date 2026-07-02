import React, { useState, useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AppLogo } from '@/components/AppLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FirebaseRecaptchaVerifierModal } from '@/components/FirebaseRecaptchaVerifierModal';
import app from '@/services/firebase';
import { AuthService } from '@/services/authService';
import { styles } from '../styles/auth.styles';

export function OtpVerificationScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const formattedPhone = phone ? phone : '9876543210';
  const maskedPhone = `+91 XXXXX${formattedPhone.slice(-5)}`;

  // OTP State: 6 individual character boxes
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Timer State (30 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Success alert visibility
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(true);
  const bannerOpacity = useRef(new Animated.Value(1)).current;

  // Verify Action Loading state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Firebase ReCAPTCHA verifier ref
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  // Timer Effect
  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle Success Alert Fade out after 6 seconds
  useEffect(() => {
    if (showSuccessBanner) {
      const timer = setTimeout(() => {
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => setShowSuccessBanner(false));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessBanner]);

  const handleTextChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    // Handle digit paste/autofill
    if (cleanText.length > 1) {
      const pastedArray = cleanText.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedArray[i] || '';
      }
      setOtp(newOtp);
      const nextFocus = Math.min(pastedArray.length, 5);
      inputRefs.current[nextFocus]?.focus();
      setFocusedIndex(nextFocus);
      return;
    }

    newOtp[index] = cleanText;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next field
    if (cleanText.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError(null);
    setLoading(true);

    try {
      const fullPhone = `+91${formattedPhone}`;
      await AuthService.sendOTP(fullPhone, recaptchaVerifier.current);

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);

      setTimeLeft(30);
      setCanResend(false);
      setShowSuccessBanner(true);
      bannerOpacity.setValue(1);
    } catch (err: any) {
      console.error('[OtpVerificationScreen] resend failed:', err);
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const user = await AuthService.verifyOTP(code);
      console.log('[OtpVerificationScreen] Successfully authenticated user:', user.uid);
      router.replace('/grant-permissions' as any);
    } catch (err: any) {
      console.error('[OtpVerificationScreen] verifyOTP failed:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP code. Please check the code and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('The OTP code has expired. Please request a new code.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScreenContainer safeAreaStyle={{ backgroundColor: '#F7F8F5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8F5" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.screenFlexContainer}>
          {/* SECTION 1 — HEADER (Fixed at top) */}
          <View style={styles.headerSectionGroup}>
            <View style={styles.headerBrandingRow}>
              <AppLogo size={32} />
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle}>VaultGov AI</Text>
                <Text style={styles.headerSubtitle}>Citizen Document Portal</Text>
              </View>
            </View>
            <View style={styles.navigationRow}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backButtonCompact,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="arrow-back" size={18} color="#1977F3" />
                <Text style={styles.backButtonCompactText}>Change number</Text>
              </Pressable>
            </View>
          </View>

          {/* SECTION 2 — MAIN CONTENT (Scrollable, Centers Core Action) */}
          <ScrollView
            style={styles.mainContentScroll}
            contentContainerStyle={styles.mainContentScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mainContentInner}>
              <View style={styles.screenIconContainer}>
                <Ionicons name="key-outline" size={32} color="#1977F3" />
              </View>

              <Text style={styles.title}>Verify OTP</Text>
              <Text style={[styles.subtitle, { marginBottom: 24 }]}>
                Enter the 6-digit code sent to{' '}
                <Text style={{ fontWeight: '600', color: '#000000' }}>
                  {maskedPhone}
                </Text>
              </Text>

              {/* Success Alert Banner */}
              {showSuccessBanner && (
                <Animated.View style={[styles.successBanner, { opacity: bannerOpacity }]}>
                  <View style={styles.successBannerIconContainer}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.successBannerText}>
                    <Text style={styles.successBannerBoldText}>OTP sent successfully!</Text> Valid for 10 minutes. Check your SMS inbox.
                  </Text>
                </Animated.View>
              )}

              {/* OTP Digit Input Box Row */}
              <View style={styles.otpGrid}>
                {otp.map((digit, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.otpInputBox,
                      focusedIndex === index && styles.otpInputBoxFocused,
                    ]}
                    onPress={() => {
                      inputRefs.current[index]?.focus();
                      setFocusedIndex(index);
                    }}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.otpDigit}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleTextChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      selectTextOnFocus
                      autoFocus={index === 0}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* SECTION 3 — ACTION AREA (Anchored to Bottom) */}
          <View style={styles.actionAreaGroup}>
            {error && (
              <Text style={[styles.inputHintError, { alignSelf: 'center', marginBottom: 16 }]}>
                {error}
              </Text>
            )}

            {/* Timer and Resend Actions */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                {timeLeft > 0 ? (
                  <>
                    Resend OTP in{' '}
                    <Text style={styles.timerTime}>{formatTimer(timeLeft)}</Text>
                  </>
                ) : (
                  'Didn’t receive the code?'
                )}
              </Text>

              <Pressable
                onPress={handleResend}
                disabled={!canResend}
                style={({ pressed }) => [
                  pressed && canResend && { opacity: 0.6 },
                ]}
              >
                <Text
                  style={[
                    styles.resendLink,
                    !canResend && styles.resendLinkDisabled,
                  ]}
                >
                  Resend OTP
                </Text>
              </Pressable>
            </View>

            <PrimaryButton
              title="Verify & Continue"
              onPress={handleVerify}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        title="Verification Required"
        cancelLabel="Cancel"
      />
    </ScreenContainer>
  );
}

export default OtpVerificationScreen;
