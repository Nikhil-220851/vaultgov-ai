/**
 * auth.persistence.ts — VaultGov Auth Persistence Layer
 *
 * Implements persistent storage for basic user session metadata
 * and onboarding progress using React Native AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  AUTH_USER: '@vaultgov/auth_user',
  ONBOARDING_COMPLETE: '@vaultgov/onboarding_complete',
} as const;

// ─── Auth User Persistence ───────────────────────────────────────────────────

export interface PersistedUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Persists the authenticated Firebase user details to local storage.
 */
export async function saveAuthUser(user: PersistedUser): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    console.log('[Persistence] saveAuthUser succeeded:', user.uid);
  } catch (error) {
    console.error('[Persistence] saveAuthUser failed:', error);
  }
}

/**
 * Retrieves the persisted Firebase user details from local storage.
 * Returns null if no user session exists.
 */
export async function getAuthUser(): Promise<PersistedUser | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return raw ? (JSON.parse(raw) as PersistedUser) : null;
  } catch (error) {
    console.error('[Persistence] getAuthUser failed:', error);
    return null;
  }
}

/**
 * Clears the persisted user from local storage (used on sign-out).
 */
export async function clearAuthUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    console.log('[Persistence] clearAuthUser succeeded');
  } catch (error) {
    console.error('[Persistence] clearAuthUser failed:', error);
  }
}

// ─── Onboarding Persistence ──────────────────────────────────────────────────

/**
 * Marks onboarding as completed so the app can skip it on future launches.
 */
export async function setOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    console.log('[Persistence] setOnboardingComplete succeeded');
  } catch (error) {
    console.error('[Persistence] setOnboardingComplete failed:', error);
  }
}

/**
 * Checks whether onboarding has been completed.
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  } catch (error) {
    console.error('[Persistence] isOnboardingComplete failed:', error);
    return false;
  }
}
