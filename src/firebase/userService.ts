// src/firebase/userService.ts
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
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
  // Create placeholder docs in 'services' and 'tickets' subcollections
  const servicesRef = doc(db, 'users', uid, 'services', 'placeholder');
  const ticketsRef = doc(db, 'users', uid, 'tickets', 'placeholder');
  await setDoc(servicesRef, { createdAt: new Date().toISOString(), placeholder: true });
  await setDoc(ticketsRef, { createdAt: new Date().toISOString(), placeholder: true });
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
