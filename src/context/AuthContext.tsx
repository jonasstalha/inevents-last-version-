import { registerPushTokenForUser } from '@/src/services/pushNotifications';
import Constants from 'expo-constants';
import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    reload,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';

const cloudFunctionBaseUrl = Constants.expoConfig?.extra?.cloudFunctionBaseUrl as string;

interface User {
  uid: string;
  email: string;
  name: string;
  phoneNumber: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  role: 'client' | 'artist' | 'admin' | null;
  storeName?: string;
  storeBio?: string;
  city?: string;
  categories?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authState: 'loading' | 'unauthenticated' | 'authenticated-unverified' | 'authenticated-verified';
  login: (email: string, password: string) => Promise<User | null>;
  register: (
    email: string,
    password: string,
    name: string,
    phoneNumber: string,
    isPhoneVerified: boolean,
    role: 'client' | 'artist' | 'admin',
    artistDetails?: {
      storeName?: string;
      storeBio?: string;
      city?: string;
      categories?: string[];
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ROLES: Array<User['role']> = ['client', 'artist', 'admin'];

const normalizeRole = (role: unknown): User['role'] => {
  if (typeof role !== 'string') return null;
  const normalized = role.trim().toLowerCase() as User['role'];
  return VALID_ROLES.includes(normalized) ? normalized : null;
};

const buildUserFromFirebase = (firebaseUser: FirebaseUser, profileData?: any): User => {
  const resolvedRole = normalizeRole(profileData?.role);
  const base = {
    uid: firebaseUser.uid,
    email: profileData?.email || firebaseUser.email || '',
    name: profileData?.name || firebaseUser.displayName || '',
    phoneNumber: profileData?.phoneNumber || firebaseUser.phoneNumber || '',
    isPhoneVerified: Boolean(profileData?.isPhoneVerified),
    isEmailVerified: firebaseUser.emailVerified,
    role: resolvedRole,
  };
  if (resolvedRole === 'artist') {
    return {
      ...base,
      storeName: profileData?.storeName,
      storeBio: profileData?.storeBio,
      city: profileData?.city,
      categories: Array.isArray(profileData?.categories)
        ? profileData.categories
        : undefined,
    };
  }
  return base;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authState = loading
    ? 'loading'
    : user
      ? user.isEmailVerified ? 'authenticated-verified' : 'authenticated-unverified'
      : 'unauthenticated';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          await reload(firebaseUser);
          const currentUser = auth.currentUser || firebaseUser;
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);

          // Sync Firebase Auth email verification with Firestore
          const isEmailVerifiedFromAuth = currentUser.emailVerified;
          if (userDoc.exists()) {
            const existingData = userDoc.data();
            if (existingData.isEmailVerified !== isEmailVerifiedFromAuth) {
              await setDoc(userRef, {
                ...existingData,
                isEmailVerified: isEmailVerifiedFromAuth,
              }, { merge: true });
            }
          } else {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email || '',
              name: currentUser.displayName || '',
              phoneNumber: currentUser.phoneNumber || '',
              isPhoneVerified: false,
              isEmailVerified: isEmailVerifiedFromAuth,
              role: null,
            }, { merge: true });
          }

          const userData = buildUserFromFirebase(currentUser, userDoc.data());
          setUser(userData);
        } catch (error) {
          console.error('Error restoring authentication state:', error);
          setUser(buildUserFromFirebase(firebaseUser));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    registerPushTokenForUser(user.uid).catch((error) => {
      console.warn('Push token registration failed:', error);
    });
  }, [user?.uid]);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await reload(userCredential.user);
      const firebaseUser = auth.currentUser || userCredential.user;

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = buildUserFromFirebase(firebaseUser, userDoc.data());

        setUser(userData);
        return userData;
      }

      const fallbackUser = buildUserFromFirebase(firebaseUser);
      await setDoc(
        userRef,
        {
          uid: fallbackUser.uid,
          email: fallbackUser.email,
          name: fallbackUser.name,
          phoneNumber: fallbackUser.phoneNumber,
          isPhoneVerified: fallbackUser.isPhoneVerified,
          isEmailVerified: firebaseUser.emailVerified,
          role: fallbackUser.role,
        },
        { merge: true },
      );
      setUser(fallbackUser);
      return fallbackUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const sendCustomVerificationEmail = async (firebaseUser: FirebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch(`${cloudFunctionBaseUrl}/sendVerificationEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ email: firebaseUser.email }),
    });
    if (!response.ok) {
      throw new Error('Unable to send verification email');
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    phoneNumber: string,
    isPhoneVerified: boolean,
    role: 'client' | 'artist' | 'admin',
    artistDetails?: {
      storeName?: string;
      storeBio?: string;
      city?: string;
      categories?: string[];
    }
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Send email verification immediately after account creation
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        name,
        phoneNumber,
        isPhoneVerified,
        isEmailVerified: false,
        role,
        ...(role === 'artist' && artistDetails ? {
          storeName: artistDetails.storeName,
          ...(artistDetails.storeBio && { storeBio: artistDetails.storeBio }),
          city: artistDetails.city,
          categories: artistDetails.categories,
        } : {}),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      await sendCustomVerificationEmail(firebaseUser);
      setUser(userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;
      await reload(firebaseUser);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = buildUserFromFirebase(firebaseUser, userDoc.data());
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        isEmailVerified: firebaseUser.emailVerified,
      }, { merge: true });
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  };

  const resendVerificationEmail = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('No authenticated user');
    await sendCustomVerificationEmail(firebaseUser);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, loading, authState, login, register, logout, refreshUser, resetPassword, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};
