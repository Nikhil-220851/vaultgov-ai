import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, Auth, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// @ts-ignore: TypeScript might complain about getReactNativePersistence missing in some type definitions, but it exists at runtime.
import { getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCQWIx6OFquLIKGpLJCLmlupiz_fOHuP3o",
  authDomain: "vaultgov.firebaseapp.com",
  projectId: "vaultgov",
  storageBucket: "vaultgov.firebasestorage.app",
  messagingSenderId: "1063458205440",
  appId: "1:1063458205440:web:ec553e484b07a0365c0de5",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;

try {

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Fallback if already initialized
  auth = getAuth(app);
}

export { auth };
export default app;