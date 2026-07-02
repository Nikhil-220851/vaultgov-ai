import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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

// Firebase Auth instance — exported for use across the app
export const auth = getAuth(app);

export default app;
