import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, User, signOut, PhoneAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { AuthResponse } from '@/features/auth/types/auth.types';

// Module-level cache for holding verificationId during OTP flow
let tempVerificationId: string | null = null;

// Required for expo-auth-session to properly close the browser on redirect
WebBrowser.maybeCompleteAuthSession();

/**
 * VaultGov — Google OAuth hook
 *
 * Uses the WEB Client ID for Expo Go compatibility.
 * When migrating to a standalone/bare build, add `androidClientId`
 * and `iosClientId` from the Google Cloud Console as well.
 */
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  /**
   * Opens the Google OAuth browser popup and signs in to Firebase.
   * Returns the authenticated Firebase User on success, null on cancel/failure.
   */
  const signIn = async (): Promise<User | null> => {
    console.log('[GoogleAuth] Initiating Google OAuth prompt...');

    let result;
    try {
      result = await promptAsync();
    } catch (promptError) {
      console.error('[GoogleAuth] promptAsync failed:', promptError);
      return null;
    }

    if (result?.type === 'cancel' || result?.type === 'dismiss') {
      console.log('[GoogleAuth] User cancelled the OAuth flow.');
      return null;
    }

    if (result?.type !== 'success') {
      console.warn('[GoogleAuth] OAuth did not succeed. Result type:', result?.type);
      return null;
    }

    const { authentication } = result;

    if (!authentication?.idToken) {
      console.error('[GoogleAuth] No idToken received from Google OAuth.');
      return null;
    }

    try {
      console.log('[GoogleAuth] Exchanging OAuth token for Firebase credential...');
      const credential = GoogleAuthProvider.credential(authentication.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      console.log('[GoogleAuth] ✅ Firebase authentication successful!');
      console.log('[GoogleAuth] User:', {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      });

      return firebaseUser;
    } catch (firebaseError) {
      console.error('[GoogleAuth] Firebase signInWithCredential failed:', firebaseError);
      return null;
    }
  };

  return {
    /** Pass to the Google button's `disabled` prop — null means not yet ready */
    request,
    /** Call this to open the Google Sign-In popup */
    signIn,
  };
};

/**
 * Authentication Service for VaultGov.
 * Contains logic for Google Sign-In and placeholders for OTP-based authentication.
 */
export const AuthService = {
  /**
   * Google Sign-In wrapper (non-hook alternative or placeholder).
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: 'mock-google-uid-12345',
            email: 'user@vaultgov.gov',
            displayName: 'Citizen User',
          },
        });
      }, 800);
    });
  },

  /**
   * Initiates authentication using OTP.
   * TODO: Implement production One-Time Password validation.
   */
  async signInWithOTP(): Promise<AuthResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: 'mock-otp-uid-67890',
            phoneNumber: '+15550199',
            displayName: 'Citizen User',
          },
        });
      }, 800);
    });
  },

  /**
   * Signs out the currently authenticated Firebase user.
   */
  async signOut(): Promise<void> {
    await signOut(auth);
    console.log('[AuthService] Signed out successfully.');
  },

  /**
   * Generates a Firebase phone verification request and sends an OTP SMS.
   * Stores the verification ID in tempVerificationId.
   */
  async sendOTP(phoneNumber: string, recaptchaVerifier: any): Promise<{ success: boolean }> {
    console.log('[AuthService] Generating Firebase phone verification for:', phoneNumber);
    const phoneProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneProvider.verifyPhoneNumber(
      phoneNumber,
      recaptchaVerifier
    );
    tempVerificationId = verificationId;
    console.log('[AuthService] Verification ID received and stored temporarily:', verificationId);
    return { success: true };
  },

  /**
   * Verifies the 6-digit OTP code against the stored verification ID and signs in.
   * Returns the authenticated Firebase user.
   */
  async verifyOTP(otpCode: string): Promise<User> {
    if (!tempVerificationId) {
      throw new Error('No active verification session found. Please request a new OTP code.');
    }
    console.log('[AuthService] Creating credential and verifying user with OTP...');
    const credential = PhoneAuthProvider.credential(tempVerificationId, otpCode);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  }
};
