import { getAuth, updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import app from './firebaseConfig';

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  categories?: string[];
  specialization?: string;
}

/**
 * Update user profile information
 */
export const updateUserProfile = async (updates: ProfileUpdateData): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const userId = currentUser.uid;
    const userDocRef = doc(db, 'users', userId);
    
    // Prepare Firestore updates
    const firestoreUpdates: any = {};
    
    // Update display name in Firebase Auth and Firestore
    if (updates.name) {
      // First get the user's role to determine if we should update storeName
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const isArtist = userData?.role === 'artist';
      
      await updateProfile(currentUser, {
        displayName: updates.name
      });
      
      if (isArtist) {
        // For artists, update storeName instead of name
        firestoreUpdates.storeName = updates.name;
        firestoreUpdates.name = userData?.name || updates.name; // Keep original name
      } else {
        firestoreUpdates.name = updates.name;
      }
      
      firestoreUpdates.displayName = updates.name;
    }

    // Update email in Firebase Auth and Firestore
    if (updates.email && updates.email !== currentUser.email) {
      await updateEmail(currentUser, updates.email);
      firestoreUpdates.email = updates.email;
    }

    // Update password in Firebase Auth
    if (updates.password) {
      await updatePassword(currentUser, updates.password);
    }

    // Update phone number
    if (updates.phone) {
      firestoreUpdates.phone = updates.phone;
    }

    // Update profile image URL
    if (updates.profileImage) {
      firestoreUpdates.profileImage = updates.profileImage;
      
      // Also update in Firebase Auth
      await updateProfile(currentUser, {
        photoURL: updates.profileImage
      });
    }

    // Update bio
    if (updates.bio !== undefined) {
      firestoreUpdates.bio = updates.bio;
    }

    // Update location
    if (updates.location !== undefined) {
      firestoreUpdates.location = updates.location;
    }

    // Update categories
    if (updates.categories !== undefined) {
      firestoreUpdates.categories = updates.categories;
    }

    // Update specialization
    if (updates.specialization !== undefined) {
      firestoreUpdates.specialization = updates.specialization;
    }

    // Update Firestore document if there are changes
    if (Object.keys(firestoreUpdates).length > 0) {
      firestoreUpdates.updatedAt = new Date();
      await updateDoc(userDocRef, firestoreUpdates);
    }

    console.log('✅ Profile updated successfully');
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
};

/**
 * Upload profile image to Firebase Storage
 */
export const uploadProfileImage = async (userId: string, imageUri: string): Promise<string> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create storage reference
    const imageRef = ref(storage, `profile-images/${userId}/${Date.now()}.jpg`);
    
    // Upload image
    const snapshot = await uploadBytes(imageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Profile image uploaded successfully');
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Update profile with image upload
 */
export const updateProfileWithImage = async (updates: ProfileUpdateData, imageUri?: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    let profileImageUrl = updates.profileImage;

    // Upload image if provided
    if (imageUri) {
      profileImageUrl = await uploadProfileImage(currentUser.uid, imageUri);
    }

    // Update profile with image URL
    await updateUserProfile({
      ...updates,
      profileImage: profileImageUrl
    });

    console.log('✅ Profile updated with image successfully');
  } catch (error) {
    console.error('❌ Error updating profile with image:', error);
    throw error;
  }
};

/**
 * Get current user profile data
 */
export const getCurrentUserProfile = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: currentUser.uid,
        ...userData,
        email: currentUser.email,
        name: userData.storeName || currentUser.displayName || userData.name,
        profileImage: currentUser.photoURL || userData.profileImage,
        bio: userData.bio || '',
        location: userData.location || '',
        categories: userData.categories || [],
        specialization: userData.specialization || '',
        phone: userData.phone || ''
      };
    }
    
    return {
      id: currentUser.uid,
      email: currentUser.email,
      name: userData?.storeName || currentUser.displayName,
      profileImage: currentUser.photoURL,
      bio: '',
      location: '',
      categories: [],
      specialization: '',
      phone: ''
    };
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    throw error;
  }
};

/**
 * Delete profile image from Firebase Storage
 */
export const deleteProfileImage = async (userId: string, imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const urlParts = imageUrl.split('/');
    const pathIndex = urlParts.findIndex((part: string) => part === 'profile-images');
    
    if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
      const imagePath = urlParts.slice(pathIndex).join('/');
      const imageRef = ref(storage, imagePath);
      
      // Note: Firebase Storage doesn't have a direct delete method in the web SDK
      // You would need to use the admin SDK or implement a cloud function for deletion
      console.log('⚠️ Image deletion requires admin SDK or cloud function');
    }
  } catch (error) {
    console.error('❌ Error deleting profile image:', error);
    // Don't throw - this is not critical
  }
};

/**
 * Update only artist-specific fields
 */
export const updateArtistProfile = async (
  artistId: string,
  updates: {
    bio?: string;
    location?: string;
    categories?: string[];
    specialization?: string;
  }
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', artistId);
    
    const firestoreUpdates: any = {};
    
    if (updates.bio !== undefined) {
      firestoreUpdates.bio = updates.bio;
    }
    
    if (updates.location !== undefined) {
      firestoreUpdates.location = updates.location;
    }
    
    if (updates.categories !== undefined) {
      firestoreUpdates.categories = updates.categories;
    }
    
    if (updates.specialization !== undefined) {
      firestoreUpdates.specialization = updates.specialization;
    }
    
    if (Object.keys(firestoreUpdates).length > 0) {
      firestoreUpdates.updatedAt = new Date();
      await updateDoc(userDocRef, firestoreUpdates);
    }
    
    console.log('✅ Artist profile updated successfully');
  } catch (error) {
    console.error('❌ Error updating artist profile:', error);
    throw error;
  }
};

/**
 * Get artist profile by ID
 */
export const getArtistProfile = async (artistId: string) => {
  try {
    const userDocRef = doc(db, 'users', artistId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: artistId,
        ...userData,
        bio: userData.bio || '',
        location: userData.location || '',
        categories: userData.categories || [],
        specialization: userData.specialization || ''
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting artist profile:', error);
    throw error;
  }
};
