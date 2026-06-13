import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, User } from 'firebase/auth';
import { auth } from '@/services/firebase';


// Required for expo-auth-session to properly close the browser on redirect
WebBrowser.maybeCompleteAuthSession();

/**
 * VaultGov — Google OAuth hook
 *
 * Uses the WEB Client ID for Expo Go compatibility.
 * When migrating to a standalone/bare build, add `androidClientId`
 * and `iosClientId` from the Google Cloud Console as well.
 *
 * Redirect URI format used by Expo Go:
 *   https://auth.expo.io/@<username>/<slug>
 */
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
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

      // Log user details for debugging — remove in production
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