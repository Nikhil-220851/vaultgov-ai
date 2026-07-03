/**
 * auth.persistence.ts — VaultGov Auth Persistence Layer
 *
 * STEP 16 — Persistence preparation.
 * This file defines the future-ready architecture for storing auth state
 * and onboarding completion using AsyncStorage.
 *
 * Currently all functions are stubs. Wire them up to real AsyncStorage
 * calls when implementing full offline-first persistence.
 *
 * TODO: Uncomment AsyncStorage imports and implementations below
 * once @react-native-async-storage/async-storage is confirmed working.
 */

// import AsyncStorage from '@react-native-async-storage/async-storage';

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
 * Persists the authenticated Firebase user to local storage.
 * TODO: Implement using AsyncStorage.setItem
 */
export async function saveAuthUser(user: PersistedUser): Promise<void> {
  // TODO: await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  console.log('[Persistence] saveAuthUser (stub):', user);
}

/**
 * Retrieves the persisted Firebase user from local storage.
 * Returns null if no user is stored.
 * TODO: Implement using AsyncStorage.getItem
 */
export async function getAuthUser(): Promise<PersistedUser | null> {
  // TODO:
  // const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
  // return raw ? (JSON.parse(raw) as PersistedUser) : null;
  return null;
}

/**
 * Clears the persisted user from local storage (used on sign-out).
 * TODO: Implement using AsyncStorage.removeItem
 */
export async function clearAuthUser(): Promise<void> {
  // TODO: await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  console.log('[Persistence] clearAuthUser (stub)');
}

// ─── Onboarding Persistence ──────────────────────────────────────────────────

/**
 * Marks onboarding as completed so the app can skip it on future launches.
 * TODO: Implement using AsyncStorage.setItem
 */
export async function setOnboardingComplete(): Promise<void> {
  // TODO: await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  console.log('[Persistence] setOnboardingComplete (stub)');
}

/**
 * Checks whether onboarding has been completed.
 * Returns false until implemented.
 * TODO: Implement using AsyncStorage.getItem
 */
export async function isOnboardingComplete(): Promise<boolean> {
  // TODO:
  // const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  // return value === 'true';
  return false;
}
