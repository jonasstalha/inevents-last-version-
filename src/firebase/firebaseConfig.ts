import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config for inexvents-2fe56 project
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.firebasestorage.app',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

const hasExistingApp = getApps().length > 0;

// Initialize app once
const app = hasExistingApp ? getApp() : initializeApp(firebaseConfig);

// Initialize auth with persistent storage in React Native
const auth = hasExistingApp
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  ;

// Initialize Firestore & Storage
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

// Re-export common Firestore / Storage helpers so consumers can import from
// a single path alongside `db` / `auth` / `storage`.
export {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
export { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default app;
export const firebaseConfigObject = firebaseConfig;
