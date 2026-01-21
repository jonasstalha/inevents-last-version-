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
      await updateProfile(currentUser, {
        displayName: updates.name
      });
      firestoreUpdates.name = updates.name;
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
      return {
        id: currentUser.uid,
        ...userDoc.data(),
        email: currentUser.email,
        name: currentUser.displayName || userDoc.data().name,
        profileImage: currentUser.photoURL || userDoc.data().profileImage
      };
    }
    
    return {
      id: currentUser.uid,
      email: currentUser.email,
      name: currentUser.displayName,
      profileImage: currentUser.photoURL
    };
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    throw error;
  }
};