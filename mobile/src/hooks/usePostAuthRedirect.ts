/**
 * usePostAuthRedirect.ts — Post-login routing hook for VaultGov AI.
 *
 * Called ONCE immediately after a successful Firebase authentication (OTP or Google).
 *
 * Responsibilities:
 *   1. Delegate all further session resolution to AuthGate.
 *
 * AuthGate is the single source of truth for Neon DB checking and profile routing.
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { User as FirebaseUser } from 'firebase/auth';

export function usePostAuthRedirect() {
  const router = useRouter();

  const handlePostAuthRedirect = useCallback(
    async (firebaseUser: FirebaseUser) => {
      console.log('[PostAuthRedirect] Delegating post-auth routing to AuthGate for:', firebaseUser.uid);
      // Route immediately to AuthGate which handles Neon lookup and profile checks
      router.replace('/auth-gate' as any);
    },
    [router]
  );

  return handlePostAuthRedirect;
}
