import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, User, signOut, signInAnonymously } from 'firebase/auth';
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
  const [request, , promptAsync] = Google.useAuthRequest({
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
   * [DEV MODE] Simulates sending an OTP SMS.
   *
   * Firebase JS SDK phone auth requires native modules (google-services.json +
   * @react-native-firebase/auth) which are unavailable in Expo Go. This mock
   * bypasses PhoneAuthProvider entirely and simulates the full OTP flow so the
   * UI can be tested end-to-end. Replace with real PhoneAuthProvider when
   * migrating to a bare/managed build with native Firebase configuration.
   */
  async sendOTP(phoneNumber: string, _recaptchaVerifier: any): Promise<{ success: boolean }> {
    console.log('[AuthService] [DEV MOCK] Simulating OTP send to:', phoneNumber);
    // Simulate a realistic network round-trip delay
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
    // Store a deterministic mock session token
    tempVerificationId = `mock-session-${Date.now()}`;
    console.log('[AuthService] [DEV MOCK] OTP "sent". Use any 6-digit code to verify.');
    return { success: true };
  },

  /**
   * [DEV MODE] Verifies the entered OTP code.
   *
   * Accepts any 6-digit numeric code and signs the user in anonymously via
   * Firebase so a real Firebase User object is returned to the rest of the app.
   */
  async verifyOTP(otpCode: string): Promise<User> {
    if (!tempVerificationId) {
      throw new Error('No active verification session found. Please request a new OTP code.');
    }
    if (!/^\d{6}$/.test(otpCode)) {
      throw new Error('Invalid OTP. Please enter the 6-digit code.');
    }
    console.log('[AuthService] [DEV MOCK] OTP accepted. Signing in anonymously...');
    tempVerificationId = null;
    // Sign in anonymously so the app receives a genuine Firebase User object
    const userCredential = await signInAnonymously(auth);
    console.log('[AuthService] [DEV MOCK] ✅ Signed in as anonymous user:', userCredential.user.uid);
    return userCredential.user;
  }
};
