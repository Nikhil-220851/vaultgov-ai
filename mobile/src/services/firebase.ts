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
// We use try/catch here because on hot-reload, getApps().length is already 1
// (the app was initialized above), but the Auth instance may also already exist.
// Calling initializeAuth on an already-initialized Auth throws "Firebase: Firebase App named
// '[DEFAULT]' already exists". getAuth() safely returns the existing instance.
let _auth: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (!_auth) {
    try {
      _auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      _auth = getAuth(app);
    }
  }
  return _auth;
}

export const auth = new Proxy({} as Auth, {
  get(target, prop, receiver) {
    const instance = getFirebaseAuth();
    const value = Reflect.get(instance, prop);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const instance = getFirebaseAuth();
    return Reflect.set(instance, prop, value);
  }
});


export default app;
