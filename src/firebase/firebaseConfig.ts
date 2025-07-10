import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyC7Mr5CAQPoqAIMLh-IefxsVugqyI8PYXA',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.appspot.com',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

// Initialize app once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use persistent auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth, app };
export default app; // Export the app instance for use in other modules
export const firebaseConfigObject = firebaseConfig; // Export the config object if needed elsewhere