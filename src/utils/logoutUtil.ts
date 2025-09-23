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
    
    // Step 1: Clear cached data first to ensure clean state
    console.log('🧹 Clearing cached data...');
    await clearCachedData();
    
    // Step 2: Clear AsyncStorage
    if (clearAllStorage) {
      console.log('🗑️ Clearing all AsyncStorage...');
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
        'profileImage',
        'artistProfile',
        'artistData'
      ];
      
      await AsyncStorage.multiRemove(authKeys);
      console.log('✅ Auth-related AsyncStorage keys cleared');
    }
    
    // Step 3: Sign out from Firebase Authentication (do this last to avoid auth state issues)
    console.log('🔐 Signing out from Firebase...');
    const auth = getAuth();
    if (auth.currentUser) {
      await signOut(auth);
      console.log('✅ Firebase authentication logout completed');
    } else {
      console.log('ℹ️ No Firebase user was logged in');
    }
    
    // Step 4: Additional cleanup - force clear any remaining state
    try {
      // Clear any potential remaining keys
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(key => 
        key.includes('user') || 
        key.includes('auth') || 
        key.includes('artist') || 
        key.includes('firebase') ||
        key.includes('session') ||
        key.includes('token')
      );
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`✅ Additional ${keysToRemove.length} keys cleared`);
      }
    } catch (additionalError) {
      console.warn('⚠️ Additional cleanup warning:', additionalError);
    }
    
    console.log('🎉 Complete logout process finished successfully');
    
    if (showSuccessMessage) {
      return { success: true, message: 'Logged out successfully' };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Complete logout error:', error);
    
    // Even if some steps fail, try to clear what we can
    try {
      console.log('🚨 Attempting emergency cleanup...');
      await AsyncStorage.clear();
      
      // Try to sign out from Firebase even in error case
      const auth = getAuth();
      if (auth.currentUser) {
        await signOut(auth);
      }
      
      console.log('✅ Emergency logout cleanup completed');
      return { success: true }; // Consider it successful if we cleared storage
    } catch (storageError) {
      console.error('❌ Emergency storage clear failed:', storageError);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown logout error' 
      };
    }
  }
};

/**
 * Clear any additional cached data specific to your app
 */
const clearCachedData = async () => {
  try {
    // Clear any app-specific cached data here
    // For example: image cache, downloaded files, temporary data, etc.
    
    // Comprehensive cache clearing for inevents app
    const cacheKeys = [
      // Artist-related cache
      'artistsCache',
      'artistProfile',
      'artistServices',
      'artistSettings',
      'artistStats',
      
      // Event and service cache
      'eventsCache', 
      'servicesCache',
      'ticketsCache',
      'ordersCache',
      
      // User activity cache
      'searchHistory',
      'recentActivity',
      'viewHistory',
      'favoriteArtists',
      'bookmarkedEvents',
      
      // UI state cache
      'navigationState',
      'tabState',
      'filterPreferences',
      'sortPreferences',
      
      // Media cache
      'imageCache',
      'profileImages',
      'serviceImages',
      
      // Auth-related cache (backup clearing)
      'firebaseUser',
      'authToken',
      'sessionData',
      'loginCredentials',
      
      // App state
      'appState',
      'userRole',
      'currentScreen',
      'lastActiveTab'
    ];
    
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('✅ Comprehensive app cache cleared');
    
    // Also clear any Redux persist storage if used
    try {
      await AsyncStorage.removeItem('persist:root');
      console.log('✅ Redux persist storage cleared');
    } catch (persistError) {
      console.log('ℹ️ No Redux persist storage found (normal)');
    }
    
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
