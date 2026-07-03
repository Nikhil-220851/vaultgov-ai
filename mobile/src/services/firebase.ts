import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// getReactNativePersistence is exported in the react-native bundle of @firebase/auth
// but NOT in the browser-facing public TypeScript types (auth-public.d.ts).
// We use require() to access it at runtime; Metro resolves to the RN bundle
// (dist/rn/index.js) which exports it correctly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require('@firebase/auth');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCQWIx6OFquLIKGpLJCLmlupiz_fOHuP3o',
  authDomain: 'vaultgov.firebaseapp.com',
  projectId: 'vaultgov',
  storageBucket: 'vaultgov.firebasestorage.app',
  messagingSenderId: '1063458205440',
  appId: '1:1063458205440:web:ec553e484b07a0365c0de5',
};

// Initialize Firebase — guard against duplicate initialisation in hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth with AsyncStorage persistence so auth state survives app restarts.
// initializeAuth is called only on the first load; subsequent hot-reloads re-use
// the already-initialised Auth instance via getAuth().
export const auth: Auth = getApps().length === 1
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export default app;
