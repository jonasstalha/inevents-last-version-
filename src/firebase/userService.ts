// src/firebase/userService.ts
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import '../firebase/firebaseConfig';

export const createUserProfile = async (
  uid: string,
  email: string,
  phone: string,
  role: string
) => {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    email,
    phone,
    role,
    createdAt: new Date().toISOString(),
  });
};

export const getUserRole = async (uid: string) => {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data().role;
  }
  return null;
};
