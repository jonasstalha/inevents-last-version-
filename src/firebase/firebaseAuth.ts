// src/firebase/firebaseAuth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps } from 'firebase/app';
import { createUserWithEmailAndPassword, getReactNativePersistence, initializeAuth, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import './firebaseConfig';

const app = getApps().length ? getApp() : undefined;

const auth = app ? initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
}) : undefined;

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential;
};

export const registerWithEmail = async (email: string, password: string, name: string) => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name });
  }
  return userCredential;
};

export const logout = async () => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  await signOut(auth);
};
