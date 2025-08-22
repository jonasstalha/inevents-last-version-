import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc, Timestamp } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginWithEmail, registerWithEmail } from '../firebase/firebaseAuth';
import { auth } from '../firebase/firebaseConfig';
import { initiatePhoneVerification, verifyCode } from '../firebase/phoneVerificationService';
import { User } from '../models/types';


// Artist details interface
interface ArtistDetails {
  storeName: string;
  city: string;
  categories: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<'artist' | 'client' | 'admin' | undefined>;
  register: (
    email: string, 
    password: string, 
    name: string, 
    phoneNumber: string,
    isPhoneVerified: boolean,
    role: 'artist' | 'client' | 'admin',
    artistDetails?: ArtistDetails
  ) => Promise<void>;
  logout: () => Promise<void>; // Changed to async
  verifyPhoneNumber: (phoneNumber: string) => Promise<{formattedPhone: string, verificationCode: string}>;
  confirmVerificationCode: (phoneNumber: string, code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen to Firebase auth state
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          console.log('Auth state changed: User logged in', firebaseUser.uid);
          
          try {
            // First check AsyncStorage for cached role (faster than Firestore)
            let cachedRole: string | null = null;
            try {
              cachedRole = await AsyncStorage.getItem('userRole');
              console.log('Auth state: Found cached role:', cachedRole);
            } catch (storageError) {
              console.log('Auth state: No cached role found:', storageError);
            }
            
            // Fetch user data from Firestore to get the correct role
            const db = getFirestore();
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userSnapshot = await getDoc(userDocRef);
            
            if (userSnapshot.exists()) {
              // User exists in Firestore, get their data including role
              const userData = userSnapshot.data();
              console.log('Auth state: User data fetched from Firestore:', userData.role);
              
              // Use role from Firestore or fallback to cached role or default
              const userRole = userData.role || cachedRole || 'client';
              console.log('Auth state: Final role decision:', userRole);
              
              // Save role to AsyncStorage for future use
              try {
                await AsyncStorage.setItem('userRole', userRole);
                console.log('Auth state: Role saved to AsyncStorage:', userRole);
              } catch (saveError) {
                console.error('Auth state: Failed to save role to AsyncStorage:', saveError);
              }
              
              // Set user with data from Firestore
              setUser({
                id: firebaseUser.uid,
                email: userData.email || firebaseUser.email || '',
                name: userData.name || firebaseUser.displayName || firebaseUser.email || '',
                role: userRole as 'artist' | 'client' | 'admin', // Cast to the correct type
                phoneNumber: userData.phoneNumber || '',
                isPhoneVerified: userData.isPhoneVerified || false,
                createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
              });
            } else {
              console.log('Auth state: No user data found in Firestore');
              
              // Use cached role or default to client
              const fallbackRole = cachedRole || 'client';
              console.log('Auth state: Using fallback role:', fallbackRole);
              
              // Default to client if no Firestore data is found
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || firebaseUser.email || '',
                role: fallbackRole as 'artist' | 'client' | 'admin',
                createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
              });
            }
          } catch (firestoreError) {
            console.error('Auth state: Error fetching user data from Firestore:', firestoreError);
            
            // Try to get role from AsyncStorage as last resort
            try {
              const savedRole = await AsyncStorage.getItem('userRole');
              console.log('Auth state: Fallback to saved role:', savedRole);
              
              // Fallback to basic user data with saved role or default
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || firebaseUser.email || '',
                role: (savedRole as 'artist' | 'client' | 'admin') || 'client',
                createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
              });
            } catch (storageError) {
              console.error('Auth state: Could not get saved role:', storageError);
              
              // Ultimate fallback
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || firebaseUser.email || '',
                role: 'client',
                createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
              });
            }
          }
        } else {
          console.log('Auth state changed: No user');
          setUser(null);
        }
      });
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      return () => {};
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('AuthContext: Attempting login with email:', email);
      
      const userCredential = await loginWithEmail(email, password);
      const firebaseUser = userCredential.user;
      
      console.log('AuthContext: Login successful for user:', firebaseUser.uid);
      
      // Fetch user data from Firestore to get the correct role
      const db = getFirestore();
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        // User exists in Firestore, get their data
        const userData = userSnapshot.data();
        console.log('AuthContext: User data fetched from Firestore:', userData);
        
        // Log the role specifically for debugging
        console.log('AuthContext: User role from Firestore:', userData.role);
        
        // Set user with data from Firestore
        const userToSet: User = {
          id: firebaseUser.uid,
          email: userData.email || firebaseUser.email || '',
          name: userData.name || firebaseUser.displayName || firebaseUser.email || '',
          role: (userData.role as 'artist' | 'client' | 'admin') || 'client', // Cast role to the correct type
          phoneNumber: userData.phoneNumber || '',
          isPhoneVerified: userData.isPhoneVerified || false,
          createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
        };
        
        console.log('AuthContext: Setting user with role:', userToSet.role);
        setUser(userToSet);
        
        // Store role in AsyncStorage for faster access and backup
        try {
          await AsyncStorage.setItem('userRole', userToSet.role);
          console.log('AuthContext: User role saved to AsyncStorage:', userToSet.role);
        } catch (storageError) {
          console.error('AuthContext: Failed to save role to AsyncStorage:', storageError);
        }
        
        console.log(`AuthContext: User role set to ${userData.role || 'client'}`);
        
        // Return the role for immediate use
        return userData.role || 'client';
      } else {
        // User doesn't exist in Firestore (unusual), use Firebase Auth data
        console.log('AuthContext: No user data found in Firestore, using Firebase Auth data');
        const userToSet: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email || '',
          role: 'client', // Default role as client
          createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
        };
        
        setUser(userToSet);
        
        // Store default role in AsyncStorage
        try {
          await AsyncStorage.setItem('userRole', 'client');
          console.log('AuthContext: Default user role saved to AsyncStorage: client');
        } catch (storageError) {
          console.error('AuthContext: Failed to save default role to AsyncStorage:', storageError);
        }
        
        // Return the default role
        return 'client';
      }
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    phoneNumber: string,
    isPhoneVerified: boolean,
    role: 'artist' | 'client' | 'admin',
    artistDetails?: ArtistDetails
  ) => {
    try {
      setLoading(true);
      console.log('AuthContext: Attempting registration with email:', email);
      
      // Check if phone is verified before proceeding
      if (!isPhoneVerified) {
        throw new Error('Phone number must be verified before registration');
      }
      
      const userCredential = await registerWithEmail(email, password, name);
      const firebaseUser = userCredential.user;
      
      console.log('AuthContext: Registration successful for user:', firebaseUser.uid);
      
      // Create the user object
      const userData: any = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: name,
        phoneNumber: phoneNumber,
        isPhoneVerified: isPhoneVerified,
        role: role,
        createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      };
      
      // Add artist-specific details if available
      if (role === 'artist' && artistDetails) {
        userData.artistDetails = {
          storeName: artistDetails.storeName,
          city: artistDetails.city,
          categories: artistDetails.categories,
        };
        console.log('Adding artist details:', artistDetails);
      }
      
      // Store user data in Firestore
      const db = getFirestore();
      const userRef = doc(db, 'users', firebaseUser.uid);
      
      await setDoc(userRef, {
        email: firebaseUser.email || '',
        name: name,
        phoneNumber: phoneNumber,
        isPhoneVerified: isPhoneVerified,
        role: role,
        createdAt: Timestamp.now(), // Use Firestore Timestamp instead of Date
        signupDate: Timestamp.now(), // Add signupDate as a backup
        ...(role === 'artist' && artistDetails ? {
          artistDetails: {
            storeName: artistDetails.storeName,
            city: artistDetails.city,
            categories: artistDetails.categories,
          }
        } : {})
      });
      
      setUser(userData);
    } catch (error: any) {
      console.error('AuthContext: Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 AuthContext logout starting...');
      // 1. Clear local state first
      setUser(null);
      setLoading(false);
      // 2. Sign out from Firebase
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
  
  // Phone verification methods
  const verifyPhoneNumber = async (phoneNumber: string): Promise<{formattedPhone: string, verificationCode: string}> => {
    try {
      console.log('Starting phone verification process for:', phoneNumber);
      // Format and send verification code via WhatsApp
      const result = await initiatePhoneVerification(phoneNumber);
      return {
        formattedPhone: result.formattedPhone,
        verificationCode: result.code
      };
    } catch (error) {
      console.error('Phone verification error:', error);
      throw error;
    }
  };
  
  const confirmVerificationCode = async (phoneNumber: string, code: string): Promise<boolean> => {
    try {
      console.log('Confirming verification code for:', phoneNumber);
      const isValid = await verifyCode(phoneNumber, code);
      return isValid;
    } catch (error) {
      console.error('Code verification error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      verifyPhoneNumber,
      confirmVerificationCode
    }}>
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