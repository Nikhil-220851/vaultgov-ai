import { GoogleAuthProvider, signInWithCredential, User, signOut, PhoneAuthProvider } from 'firebase/auth';
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
   * Initiates authentication using OTP via real Firebase Phone Auth.
   *
   * @param phoneNumber Formatted E.164 phone number, e.g. +91XXXXXXXXXX
   * @param recaptchaVerifier ApplicationVerifier instance (e.g. FirebaseRecaptchaVerifierModal)
   */
  async sendOTP(phoneNumber: string, recaptchaVerifier: any): Promise<{ success: boolean }> {
    console.log('[AuthService] sendOTP started for phone:', phoneNumber);
    if (!phoneNumber) {
      throw new Error('Phone number is required.');
    }
    if (!recaptchaVerifier) {
      throw new Error('reCAPTCHA verifier is required.');
    }

    try {
      console.log('[AuthService] Creating PhoneAuthProvider...');
      const provider = new PhoneAuthProvider(auth);

      // Runtime Diagnostics
      console.log('[AuthService] Runtime Diagnostics:', {
        authInstance: auth ? 'Initialized' : 'Undefined',
        providerInstance: provider ? 'Created' : 'Undefined',
        providerType: provider?.providerId || 'Unknown',
        recaptchaVerifier: recaptchaVerifier ? {
          type: recaptchaVerifier.type,
          hasVerify: typeof recaptchaVerifier.verify === 'function',
          hasReset: typeof recaptchaVerifier._reset === 'function',
        } : 'Null/Undefined',
        firebaseConfig: auth?.app?.options ? {
          apiKey: auth.app.options.apiKey ? 'Present' : 'Missing',
          authDomain: auth.app.options.authDomain ? 'Present' : 'Missing',
          projectId: auth.app.options.projectId ? 'Present' : 'Missing',
          appId: auth.app.options.appId ? 'Present' : 'Missing',
        } : 'Undefined',
      });

      console.log('[AuthService] Calling verifyPhoneNumber with verifier...');
      const verificationId = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
      
      console.log('[AuthService] verifyPhoneNumber succeeded. Verification ID received:', verificationId);
      tempVerificationId = verificationId;

      return { success: true };
    } catch (err: any) {
      console.error('[AuthService] sendOTP failed with error:', err);
      throw err;
    }
  },

  /**
   * Verifies the entered OTP code against the stored verification ID.
   * Authenticates the user in Firebase via Phone Authentication.
   *
   * @param otpCode 6-digit numeric OTP code entered by the user
   */
  async verifyOTP(otpCode: string): Promise<User> {
    console.log('[AuthService] verifyOTP started. Entered code length:', otpCode?.length);
    if (!tempVerificationId) {
      console.error('[AuthService] verifyOTP error: tempVerificationId is null');
      throw new Error('No active verification session found. Please request a new OTP code.');
    }
    if (!/^\d{6}$/.test(otpCode)) {
      throw new Error('Invalid OTP. Please enter the 6-digit code.');
    }

    try {
      console.log('[AuthService] Building PhoneAuthProvider credential...');
      const credential = PhoneAuthProvider.credential(tempVerificationId, otpCode);

      console.log('[AuthService] Calling signInWithCredential...');
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      console.log('[AuthService] ✅ Real Firebase Phone Auth Sign-In Successful!');
      console.log('[AuthService] Firebase UID:', firebaseUser.uid);
      console.log('[AuthService] Firebase Phone Number:', firebaseUser.phoneNumber);
      console.log('[AuthService] Firebase ProviderData:', JSON.stringify(firebaseUser.providerData, null, 2));

      // Clear the temp session cache on success
      tempVerificationId = null;
      return firebaseUser;
    } catch (err: any) {
      console.error('[AuthService] verifyOTP failed with error:', err);
      throw err;
    }
  }
};

/**
 * Translates Firebase Authentication error codes to clear, human-friendly messages.
 */
export const getReadableAuthError = (err: any): string => {
  if (!err) return 'An unknown authentication error occurred.';
  const code = err.code || (err.message && err.message.includes('auth/') ? err.message : null);
  
  if (!code) {
    return err.message || 'Authentication failed. Please try again.';
  }

  if (code.includes('auth/invalid-phone-number')) {
    return 'Invalid phone number format. Please check and try again.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Too many requests. SMS verification has been temporarily blocked for this phone number. Please try again later.';
  }
  if (code.includes('auth/invalid-app-credential') || code.includes('auth/app-not-authorized')) {
    return 'App verification failed. Please verify that Google Play Services and safety check signatures are configured properly.';
  }
  if (code.includes('auth/invalid-verification-code')) {
    return 'Invalid OTP code. Please check the SMS and enter the 6-digit code again.';
  }
  if (code.includes('auth/code-expired')) {
    return 'The OTP verification code has expired. Please request a new OTP.';
  }
  if (code.includes('auth/operation-not-allowed')) {
    return 'Phone authentication is not enabled in Firebase Console.';
  }
  if (code.includes('auth/quota-exceeded')) {
    return 'SMS quota exceeded. Please try again later.';
  }
  
  return err.message || 'Authentication failed. Please try again.';
};
