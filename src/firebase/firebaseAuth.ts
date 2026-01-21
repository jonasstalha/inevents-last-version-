// src/firebase/firebaseAuth.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, getAuth } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

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

// Check if phone number already exists
export const checkPhoneNumberExists = async (phoneNumber: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Returns true if phone exists
  } catch (error) {
    console.error('Error checking phone number:', error);
    throw error;
  }
};

// Store phone number verification
export const storePhoneVerification = async (userId: string, phoneNumber: string, verified: boolean) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await setDoc(userRef, {
        phoneNumber: phoneNumber,
        phoneVerified: verified,
        phoneVerifiedAt: verified ? new Date() : null,
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error storing phone verification:', error);
    throw error;
  }
};
