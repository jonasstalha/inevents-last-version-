/**
 * Comprehensive logout utility for inevents app
 * Handles Firebase auth, AsyncStorage, and app state cleanup
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signOut } from 'firebase/auth';

export interface LogoutOptions {
  clearAllStorage?: boolean;
  redirectTo?: string;
  showSuccessMessage?: boolean;
}

export const performCompleteLogout = async (options: LogoutOptions = {}) => {
  const {
    clearAllStorage = true,
    showSuccessMessage = false
  } = options;

  try {
    console.log('🔄 Starting complete logout process...');
    
    // Step 1: Sign out from Firebase Authentication
    const auth = getAuth();
    if (auth.currentUser) {
      await signOut(auth);
      console.log('✅ Firebase authentication logout completed');
    } else {
      console.log('ℹ️ No Firebase user was logged in');
    }
    
    // Step 2: Clear AsyncStorage if requested
    if (clearAllStorage) {
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage completely cleared');
    } else {
      // Clear only auth-related keys
      const authKeys = [
        'userToken', 
        'refreshToken', 
        'userData', 
        'authState', 
        'lastLoginTime',
        'userPreferences',
        'profileImage'
      ];
      
      await AsyncStorage.multiRemove(authKeys);
      console.log('✅ Auth-related AsyncStorage keys cleared');
    }
    
    // Step 3: Clear any cached data that might persist
    await clearCachedData();
    
    console.log('🎉 Complete logout process finished successfully');
    
    if (showSuccessMessage) {
      return { success: true, message: 'Logged out successfully' };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Complete logout error:', error);
    
    // Even if some steps fail, try to clear what we can
    try {
      await AsyncStorage.clear();
      console.log('✅ Emergency AsyncStorage clear completed');
    } catch (storageError) {
      console.error('❌ Emergency storage clear failed:', storageError);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown logout error' 
    };
  }
};

/**
 * Clear any additional cached data specific to your app
 */
const clearCachedData = async () => {
  try {
    // Clear any app-specific cached data here
    // For example: image cache, downloaded files, temporary data, etc.
    
    // Example of clearing specific cached items:
    const cacheKeys = [
      'artistsCache',
      'eventsCache', 
      'ticketsCache',
      'ordersCache',
      'searchHistory',
      'recentActivity'
    ];
    
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('✅ App-specific cache cleared');
    
  } catch (error) {
    console.error('⚠️ Cache clearing error (non-critical):', error);
    // Don't throw - this is non-critical
  }
};

/**
 * Quick logout for emergencies or force logout scenarios
 */
export const emergencyLogout = async () => {
  try {
    // Force clear everything without waiting for Firebase
    await AsyncStorage.clear();
    
    // Try Firebase logout but don't wait for it
    const auth = getAuth();
    signOut(auth).catch(error => {
      console.warn('Firebase logout failed during emergency logout:', error);
    });
    
    console.log('🚨 Emergency logout completed');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Emergency logout failed:', error);
    return { success: false, error: 'Emergency logout failed' };
  }
};

export default performCompleteLogout;
