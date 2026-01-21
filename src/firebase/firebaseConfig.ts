import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config for inevents-2fe56 project
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.appspot.com',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

// Initialize app once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
export default app; // Export the app instance for use in other modules
export const firebaseConfigObject = firebaseConfig; // Export the config object if needed elsewhere