// src/firebase/firebaseAuth.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth } from './firebaseConfig';

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Firebase login successful:', userCredential.user.uid);
    return userCredential;
  } catch (error) {
    console.error('Firebase login error:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
    }
    console.log('Firebase registration successful:', userCredential.user.uid);
    return userCredential;
  } catch (error) {
    console.error('Firebase registration error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    console.log('Firebase logout successful');
  } catch (error) {
    console.error('Firebase logout error:', error);
    throw error;
  }
};
