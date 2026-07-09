/**
 * auth-gate.tsx — Session resolver for VaultGov AI.
 *
 * Reached ONLY from the Splash screen when a Firebase session already exists.
 *
 * Responsibilities:
 *   1. Confirm the Firebase auth state (onAuthStateChanged fires once)
 *   2. Obtain a fresh Firebase ID token and inject it into apiClient
 *   3. Query Neon (GET /api/v1/users/:uid)
 *   4. Route based on profile_completed + device permissions
 *
 * Must NOT:
 *   • Call the backend for unauthenticated users
 *   • Handle fresh login flows (that is usePostAuthRedirect's job)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import Constants, { AppOwnership } from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer } from '@/components/ScreenContainer';
import { auth } from '@/services/firebase';
import { apiClient, ApiError } from '@/services/api';
import { API_BASE_URL } from '@/config/api.config';
import { isOnboardingComplete } from '../features/auth/services/auth.persistence';
import { useUser } from '@/context/UserContext';
import { Colors, Typography, Radius } from '@/theme';

const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true for network / connection / timeout errors that merit a retry prompt. */
function isNetworkError(err: any): boolean {
  if (err instanceof ApiError) {
    // API errors with status codes (e.g. 404, 403) are not network failures
    return false;
  }
  if (!err?.message) return false;
  const msg: string = err.message.toLowerCase();
  return (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('failed to connect') ||
    msg.includes('timed out') ||
    msg.includes('connect') ||
    msg.includes('econnrefused')
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AuthGateScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // ── Permission helper ─────────────────────────────────────────────────────
  // (Removed checkPermissions as it was redundant with DB state check)


  // ── Core resolution logic (extracted so Retry can reuse it) ──────────────

  const isResolvingRef = useRef(false);

  const resolveSession = useCallback(async () => {
    if (isResolvingRef.current) {
      console.log('[AuthGate] resolveSession() skipped (already resolving)');
      return;
    }
    isResolvingRef.current = true;

    console.log('[AuthGate] resolveSession() triggered');
    return new Promise<void>((resolve) => {
      console.log('[AuthGate] Subscribing to onAuthStateChanged...');
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        console.log('[AuthGate] onAuthStateChanged fired. User:', fbUser ? fbUser.uid : 'null');
        unsubscribe();

        if (!fbUser) {
          // Auth-gate should only be reached with an active session.
          // If Firebase has no session, fall back gracefully.
          console.log('[AuthGate] No Firebase session — redirecting.');
          try {
            console.log('[AuthGate] Checking onboarding state...');
            const onboarded = await isOnboardingComplete();
            console.log('[AuthGate] Onboarding complete status:', onboarded);
            router.replace(onboarded ? ('/login' as any) : ('/onboarding' as any));
          } catch (e) {
            console.log('[AuthGate] Error checking onboarding status, redirecting to onboarding:', e);
            router.replace('/onboarding' as any);
          }
          resolve();
          return;
        }

        console.log('[AuthGate] Firebase session confirmed:', fbUser.uid);

        try {
          // 1. Get a fresh ID token and inject into the API client
          console.log('[AuthGate] Calling fbUser.getIdToken()...');
          const idToken = await fbUser.getIdToken();
          console.log('[AuthGate] getIdToken() succeeded, token prefix:', idToken ? idToken.substring(0, 15) : 'null');
          apiClient.setAuthToken(idToken);

          // ── DIAGNOSTIC: bare-metal /health test ──────────────────────────
          try {
            console.log('========== NETWORK TEST ==========');
            console.log('[NETWORK TEST] API_BASE_URL:', API_BASE_URL);
            console.log('[NETWORK TEST] process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
            console.log('[NETWORK TEST] Constants.appOwnership:', Constants.appOwnership);
            console.log('[NETWORK TEST] isExpoGo:', isExpoGo);
            const healthUrl = `${API_BASE_URL}/health`;
            console.log('[NETWORK TEST] Calling fetch:', healthUrl);
            const healthRes = await fetch(healthUrl);
            const healthText = await healthRes.text();
            console.log('[NETWORK TEST] /health status:', healthRes.status);
            console.log('[NETWORK TEST] /health body:', healthText);
            console.log('[NETWORK TEST] SUCCESS — React Native networking is working');
            console.log('========== END NETWORK TEST ==========');
          } catch (netErr: any) {
            console.log('========== NETWORK TEST FAILED ==========');
            console.log('[NETWORK TEST] Error name:', netErr?.name);
            console.log('[NETWORK TEST] Error message:', netErr?.message);
            console.log('[NETWORK TEST] Error stack:', netErr?.stack);
            console.log('[NETWORK TEST] Full error:', netErr);
            console.log('[NETWORK TEST] JSON:', JSON.stringify(netErr));
            console.log('========== END NETWORK TEST ==========');
          }
          // ── END DIAGNOSTIC ─────────────────────────────────────────────────

          // 2. Fetch user profile from Neon
          console.log('[AuthGate] Fetching user profile from Neon DB via apiClient.getUser...');
          let dbUser;
          try {
            dbUser = await apiClient.getUser(fbUser.uid);
            console.log('[AuthGate] apiClient.getUser success:', dbUser ? dbUser.id : 'null');
          } catch (err: any) {
            if (err instanceof ApiError && err.status === 404) {
              console.log('[AuthGate] User not in Neon (404) → Automatically creating minimal user record.');
              dbUser = await apiClient.upsertUser({
                firebase_uid: fbUser.uid,
                mobile_number: fbUser.phoneNumber ?? null,
                email: fbUser.email ?? null,
              });
            } else {
              throw err; // will be caught by outer catch block
            }
          }
          
          setUser(dbUser);

          console.log('[AuthGate] Profile fetched:', {
            profile_completed: dbUser.profile_completed,
          });

          // 3. Route based on profile + permissions state
          if (!dbUser.profile_completed) {
            console.log('[AuthGate] Profile incomplete → Complete Profile.');
            router.replace('/complete-profile' as any);
          } else if (!dbUser.onboarding_permissions_seen) {
            console.log('[AuthGate] Permissions missing → Grant Permissions.');
            router.replace('/grant-permissions' as any);
          } else {
            console.log('[AuthGate] All steps complete → Home.');
            router.replace('/(tabs)/home' as any);
          }
        } catch (err: any) {
          console.log('[AuthGate] resolveSession caught error:', err);
          console.error('[AuthGate] Session resolution failed:', err);
          setChecking(false);

          if (isNetworkError(err)) {
            setErrorMsg(
              `Unable to reach the server at:\n${API_BASE_URL}\n\n` +
                'Make sure your device and backend are on the same Wi-Fi network, then tap Retry.'
            );
          } else {
            setErrorMsg(
              err.message || 'An unexpected error occurred while loading your profile.'
            );
          }
        }
        isResolvingRef.current = false;
        resolve();
      });
    });
  }, [router, setUser]);

  // ── Retry handler ─────────────────────────────────────────────────────────

  const handleRetry = useCallback(async () => {
    setErrorMsg(null);
    setChecking(true);
    await resolveSession();
  }, [resolveSession]);

  // ── Mount effect ──────────────────────────────────────────────────────────

  useEffect(() => {
    resolveSession();
    // resolveSession is stable (useCallback with stable deps), so this only runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer safeAreaStyle={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8F5" />
      <View style={styles.container}>
        <View style={styles.card}>
          {checking ? (
            <>
              <ActivityIndicator size="large" color={Colors.primaryBlue} style={styles.spinner} />
              <Text style={styles.loadingTitle}>Connecting to VaultGov</Text>
              <Text style={styles.loadingText}>Initializing secure session...</Text>
            </>
          ) : (
            <>
              <View style={styles.errorIconBg}>
                <Ionicons name="wifi-outline" size={32} color={Colors.dangerRed} />
              </View>
              <Text style={styles.errorTitle}>Connection Error</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>

              <Pressable
                onPress={handleRetry}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F7F8F5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: '#E5E7F0',
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  spinner: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  errorIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: Colors.primaryBlue,
    borderRadius: Radius.button,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 15,
    fontWeight: Typography.weights.semibold,
    color: '#FFFFFF',
  },
});
