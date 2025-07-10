import React, { createContext, useContext, useState } from 'react';
import { User } from '../models/types';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'artist' | 'client' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

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
      // Clear user state
      setUser(null);
      
      // Clear any stored authentication data
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.multiRemove(['userToken', 'userData', 'isLoggedIn']);
      } catch (storageError) {
        console.log('AsyncStorage clear error:', storageError);
      }
      
      // If using Firebase auth (when available), sign out
      try {
        if (typeof window !== 'undefined') {
          // For web
          if (window.localStorage) {
            window.localStorage.clear();
          }
        }
      } catch (error) {
        console.log('Logout cleanup error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
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