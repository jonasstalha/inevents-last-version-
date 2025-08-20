import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import React, { createContext, useContext, useState } from 'react';
import { User } from '../models/types';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'artist' | 'client' | 'admin') => Promise<void>;
  logout: () => Promise<void>; // Changed to async
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen to Firebase auth state
  React.useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // You may want to fetch more user info from Firestore here
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email || '',
          role: 'artist', // You may want to fetch the real role from Firestore
          createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setUser({ id: 'fake-uid', email, name: 'Fake User', role: 'client', createdAt: new Date() });
    setLoading(false);
  };

  const register = async (email: string, password: string, name: string, role: 'artist' | 'client' | 'admin') => {
    setLoading(true);
    setUser({ id: 'fake-uid', email, name, role, createdAt: new Date() });
    setLoading(false);
  };

  const logout = async () => {
    try {
      console.log('🔄 AuthContext logout starting...');
      // 1. Clear local state first
      setUser(null);
      setLoading(false);
      // 2. Sign out from Firebase
      const auth = getAuth();
      await signOut(auth);
      // 3. Clear AsyncStorage
      await AsyncStorage.clear();
      console.log('✅ AuthContext logout completed');
    } catch (error) {
      console.error('❌ AuthContext logout error:', error);
      // Even if Firebase logout fails, clear local state
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};