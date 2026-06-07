import React, { useState, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AppLogo } from '@/components/AppLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { styles } from '../styles/auth.styles';

export function MobileNumberScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animated scale for checkbox tap feedback
  const checkboxScale = useRef(new Animated.Value(1)).current;

  const handleCheckboxPress = () => {
    setIsChecked(!isChecked);
    Animated.sequence([
      Animated.timing(checkboxScale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(checkboxScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSendOtp = async () => {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    if (digitsOnly.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!isChecked) {
      setError('You must agree to the Terms of Service & Privacy Policy');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1200));
      router.push({
        pathname: '/verify-otp',
        params: { phone: digitsOnly },
      });
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) {
      setPhoneNumber(digits);
      if (error) setError(null);
    }
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
                <Text style={styles.backButtonCompactText}>Back</Text>
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
                <Ionicons name="phone-portrait-outline" size={32} color="#1977F3" />
              </View>

              <Text style={styles.title}>Enter Mobile Number</Text>
              <Text style={[styles.subtitle, { marginBottom: 24 }]}>
                We'll send a 6-digit OTP to verify your identity. No password needed.
              </Text>

              {/* Input Section */}
              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <View
                style={[
                  styles.phoneInputWrapper,
                  isFocused && styles.phoneInputWrapperFocused,
                  error && error.includes('digit') && styles.phoneInputWrapperError,
                ]}
              >
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>IN +91</Text>
                </View>
                <TextInput
                  style={styles.mobileInput}
                  placeholder="98765 43210"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={10}
                  autoFocus
                />
              </View>

              {/* Helper Hint */}
              {error && error.includes('digit') ? (
                <Text style={styles.inputHintError}>{error}</Text>
              ) : (
                <Text style={styles.inputHint}>
                  Enter your 10-digit Aadhaar-linked mobile number
                </Text>
              )}
            </View>
          </ScrollView>

          {/* SECTION 3 — ACTION AREA (Anchored to Bottom) */}
          <View style={styles.actionAreaGroup}>
            {error && !error.includes('digit') && (
              <Text style={[styles.inputHintError, { marginBottom: 8, alignSelf: 'center' }]}>
                {error}
              </Text>
            )}
            <Pressable
              onPress={handleCheckboxPress}
              style={styles.checkboxContainer}
            >
              <Animated.View
                style={[
                  styles.checkboxSquare,
                  isChecked && styles.checkboxChecked,
                  { transform: [{ scale: checkboxScale }] },
                ]}
              >
                {isChecked && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </Animated.View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text
                  style={styles.checkboxLabelLink}
                  onPress={() => console.log('Terms')}
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.checkboxLabelLink}
                  onPress={() => console.log('Privacy')}
                >
                  Privacy Policy
                </Text>
                . My data will be handled per the{' '}
                <Text
                  style={styles.checkboxLabelLink}
                  onPress={() => console.log('Guidelines')}
                >
                  DigiLocker guidelines
                </Text>
                .
              </Text>
            </Pressable>

            <PrimaryButton
              title="Send OTP"
              onPress={handleSendOtp}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

export default MobileNumberScreen;
