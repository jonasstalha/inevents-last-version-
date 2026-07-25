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
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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

const auth = getAuth(app);

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
