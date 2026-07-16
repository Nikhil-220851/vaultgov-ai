/**
 * UserContext.tsx — Global auth + DB user state for VaultGov AI.
 *
 * Provides:
 *  - firebaseUser: the authenticated Firebase User object (or null)
 *  - user: the VaultGov DB user record (or null)
 *  - isLoading: true while determining auth state on app launch
 *  - setUser: manually update the DB user (e.g. after profile save)
 *  - refetchUser: re-fetch user from backend (call only when already authenticated)
 *  - signOut: Firebase sign-out + context clear
 *
 * Design contract:
 *   This context deliberately does NOT call the Neon backend in onAuthStateChanged.
 *   The backend is reached ONLY after Firebase auth succeeds via:
 *     • AuthGate   (returning users)
 *     • usePostAuthRedirect (fresh logins via OTP / Google)
 *   This prevents connection errors from blocking the splash screen or freezing the app.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';

import { auth } from '@/services/firebase';
import { apiClient, VaultGovUser } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';


// ─── Types ────────────────────────────────────────────────────────────────────

interface UserContextValue {
  firebaseUser: FirebaseUser | null;
  user: VaultGovUser | null;
  isLoading: boolean;
  setUser: (u: VaultGovUser | null) => void;
  refetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextValue>({
  firebaseUser: null,
  user: null,
  isLoading: true,
  setUser: () => undefined,
  refetchUser: async () => undefined,
  signOut: async () => undefined,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<VaultGovUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Re-fetch the DB profile for the currently authenticated Firebase user.
   * Only call this when you are SURE the user is already authenticated;
   * it requires a valid Firebase ID token.
   */
  const refetchUser = useCallback(async () => {
    console.log(`[UserContext refetchUser Debug] Checking Firebase user... User exists: ${!!firebaseUser} (UID: ${firebaseUser?.uid ?? 'null'})`);
    if (!firebaseUser) {
      setUser(null);
      return;
    }
    try {
      console.log('[UserContext refetchUser Debug] Retrieving Firebase ID token...');
      const idToken = await firebaseUser.getIdToken();
      console.log(`[UserContext refetchUser Debug] ID token retrieved successfully (prefix: ${idToken ? idToken.substring(0, 15) : 'null'}...)`);
      apiClient.setAuthToken(idToken);
      const dbUser = await apiClient.getUser(firebaseUser.uid);
      setUser(dbUser);
    } catch (err) {
      console.warn('[UserContext] refetchUser failed:', err);
      setUser(null);
    }
  }, [firebaseUser]);

  /**
   * Listen for Firebase auth state changes on mount.
   *
   * IMPORTANT: We do NOT call the Neon backend here.
   * Doing so would race against the splash screen and fail if the backend
   * is unreachable at launch time.
   *
   * Responsibility split:
   *   • Firebase session exists  → AuthGate performs the Neon lookup
   *   • Fresh login (OTP/Google) → usePostAuthRedirect upserts + routes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser) {
        // User signed out — clear auth token and any cached DB record
        apiClient.clearAuthToken();
        setUser(null);
      }
      // Do NOT fetch from Neon here. AuthGate/usePostAuthRedirect handle that.

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      console.log('Firebase Sign Out Started');
      await firebaseSignOut(auth);
      console.log('Firebase Sign Out Complete');
    } catch (err) {
      console.error('[UserContext] signOut error:', err);
    } finally {
      console.log('Google Sign Out Started');
      try {
        await GoogleSignin.signOut();
        console.log('Google Sign Out Complete');
      } catch (gErr) {
        console.error('[UserContext] Google Sign Out Error:', gErr);
      }

      // Check current user states after logout
      try {
        const googleUser = GoogleSignin.getCurrentUser();
        console.log('Google Current User After Logout:', googleUser);
      } catch {
        console.log('Google Current User After Logout: null');
      }
      console.log('Firebase Current User After Logout:', auth.currentUser);

      apiClient.clearAuthToken();
      setFirebaseUser(null);
      setUser(null);
      try {
        await AsyncStorage.removeItem('@vaultgov/auth_user');
        console.log('AsyncStorage Cleared');
      } catch (e) {
        console.error('[UserContext] Failed to clear AsyncStorage:', e);
      }
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        firebaseUser,
        user,
        isLoading,
        setUser,
        refetchUser,
        signOut: handleSignOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUser(): UserContextValue {
  return useContext(UserContext);
}

export default UserContext;
