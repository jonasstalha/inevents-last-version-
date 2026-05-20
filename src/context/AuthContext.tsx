import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';

interface User {
  uid: string;
  email: string;
  name: string;
  phoneNumber: string;
  isPhoneVerified: boolean;
  role: 'client' | 'artist' | 'admin';
  storeName?: string;
  storeBio?: string;
  city?: string;
  categories?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { ...userDoc.data(), uid: firebaseUser.uid } as User;
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Validate that the role field exists and is valid
        if (data.role && ['client', 'artist', 'admin'].includes(data.role)) {
          const userData: User = {
            uid: firebaseUser.uid,
            email: data.email || firebaseUser.email || '',
            name: data.name || '',
            phoneNumber: data.phoneNumber || '',
            isPhoneVerified: data.isPhoneVerified || false,
            role: data.role,
            storeName: data.storeName,
            storeBio: data.storeBio,
            city: data.city,
            categories: data.categories,
          };
          return userData;
        } else {
          console.error('User document exists but role field is missing or invalid:', data);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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

      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        name,
        phoneNumber,
        isPhoneVerified,
        role,
        ...(role === 'artist' && artistDetails ? {
          storeName: artistDetails.storeName,
          ...(artistDetails.storeBio && { storeBio: artistDetails.storeBio }),
          city: artistDetails.city,
          categories: artistDetails.categories,
        } : {}),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
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
      if (!firebaseUser) return;
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = { ...userDoc.data(), uid: firebaseUser.uid } as User;
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
