import { GoogleAuthProvider, signInWithCredential, User, signOut, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import { AuthResponse } from '@/features/auth/types/auth.types';
import { GoogleSignin, statusCodes, isSuccessResponse } from '@react-native-google-signin/google-signin';

// Module-level cache for holding verificationId during OTP flow
let tempVerificationId: string | null = null;

if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
  console.warn('[GoogleAuth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured in .env');
} else {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
}

/**
 * VaultGov — Google OAuth hook (Native version)
 */
export const useGoogleAuth = () => {
  /**
   * Opens the Google Sign-In native dialog and signs in to Firebase.
   * Returns the authenticated Firebase User on success, null on cancel/failure.
   */
  const signIn = async (): Promise<User | null> => {
    console.log('[GoogleAuth] Initiating native Google Sign-In...');

    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      console.error('[GoogleAuth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured.');
      return null;
    }

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      if (!isSuccessResponse(signInResult)) {
        console.log('[GoogleAuth] Google Sign-In was cancelled or did not succeed.');
        return null;
      }

      const idToken = signInResult.data.idToken;
      if (!idToken) {
        console.error('[GoogleAuth] No idToken received from native Google Sign-In.');
        return null;
      }

      console.log('[GoogleAuth] Exchanging native Google token for Firebase credential...');
      const credential = GoogleAuthProvider.credential(idToken);
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
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[GoogleAuth] User cancelled the Google Sign-In flow.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[GoogleAuth] Google Sign-In is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('[GoogleAuth] Play Services are not available or outdated.');
      } else {
        console.error('[GoogleAuth] Native Google Sign-In failed with error:', error);
      }
      return null;
    }
  };

  return {
    /** Pass to the Google button's `disabled` prop — dummy object to enable it */
    request: {},
    /** Call this to open the Google Sign-In native dialog */
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
