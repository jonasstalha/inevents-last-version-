import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { auth } from './firebaseConfig';

export const registerWithEmail = async (
  email: string,
  password: string,
  name: string,
  phoneNumber: string,
  isPhoneVerified: boolean,
  role: 'client' | 'artist',
  artistDetails?: {
    storeName?: string;
    storeBio?: string;
    city?: string;
    categories?: string[];
  }
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, { displayName: name });

    // Create user document in Firestore
    const db = getFirestore();
    const userData: any = {
      uid: user.uid,
      email: user.email,
      name,
      phoneNumber,
      isPhoneVerified,
      role,
      createdAt: new Date().toISOString(),
    };

    // Add artist-specific fields if role is artist
    if (role === 'artist' && artistDetails) {
      userData.storeName = artistDetails.storeName || '';
      userData.storeBio = artistDetails.storeBio || '';
      userData.city = artistDetails.city || '';
      userData.categories = artistDetails.categories || [];
      userData.rating = 0;
      userData.totalRatings = 0;
    }

    await setDoc(doc(db, 'users', user.uid), userData);

    return userCredential;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed');
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error(error.message || 'Logout failed');
  }
};
