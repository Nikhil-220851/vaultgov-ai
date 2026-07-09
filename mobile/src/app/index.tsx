/**
 * index.tsx — Splash Screen entry point for VaultGov AI.
 *
 * Responsibilities (ONLY):
 *   1. Show branding / animation for 2-3 seconds
 *   2. After animation, check Firebase session state (synchronous — no network call)
 *   3. Route accordingly:
 *        Firebase session present  →  /auth-gate  (AuthGate handles Neon lookup)
 *        No Firebase session       →  /onboarding or /login (no backend touch)
 *
 * Must NOT:
 *   • Call the backend / Neon
 *   • Await async API calls
 *   • Perform any business logic
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SplashScreen } from '../screens/SplashScreen';
import { auth } from '@/services/firebase';
import { isOnboardingComplete } from '../features/auth/services/auth.persistence';

export default function AppEntry() {
  const router = useRouter();

  /**
   * Called exactly once when the splash animation finishes (~2-3 s).
   * Checks the LOCAL Firebase session (no network round-trip) and routes.
   */
  const handleFinish = useCallback(async () => {
    try {
      const hasSession = !!auth.currentUser;

      if (hasSession) {
        // Authenticated — let AuthGate handle the Neon DB check & routing
        router.replace('/auth-gate' as any);
      } else {
        // Not authenticated — route based on onboarding completion (AsyncStorage only)
        const onboarded = await isOnboardingComplete().catch(() => false);
        router.replace(onboarded ? ('/login' as any) : ('/onboarding' as any));
      }
    } catch {
      // Absolute fallback — always navigate somewhere safe
      router.replace('/onboarding' as any);
    }
  }, [router]);

  return <SplashScreen onFinish={handleFinish} />;
}
