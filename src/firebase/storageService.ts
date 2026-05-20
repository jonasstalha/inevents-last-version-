import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { Platform } from 'react-native';
import app from './firebaseConfig';

// Initialize Firebase Storage
const storage = getStorage(app);

// Debug: Log storage configuration
console.log('[StorageService] Storage initialized:', {
  bucket: storage.app.options.storageBucket,
  projectId: storage.app.options.projectId
});

/**
 * Convert an image URI to a blob for uploading to Firebase Storage
 * @param uri The local URI of the image
 * @returns A Promise resolving to a Blob
 */
const uriToBlob = async (uri: string): Promise<Blob> => {
  console.log('[StorageService] uriToBlob called:', { uri, platform: Platform.OS });
  
  // On web, fetch the URI and get the blob directly
  if (Platform.OS === 'web') {
    console.log('[StorageService] Using web fetch for blob');
    const response = await fetch(uri);
    const blob = await response.blob();
    console.log('[StorageService] Web blob created:', { size: blob.size, type: blob.type });
    return blob;
  } 
  
  // On native platforms, use FileSystem to read the file
  console.log('[StorageService] Using FileSystem for native blob');
  const fileInfo = await FileSystem.getInfoAsync(uri);
  console.log('[StorageService] File info:', fileInfo);
  
  if (!fileInfo.exists) {
    console.error('[StorageService] File does not exist:', uri);
    throw new Error('File does not exist');
  }
  
  // Use readAsStringAsync with base64 encoding
  const fileContent = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any,
  });
  
  console.log('[StorageService] File content read, length:', fileContent.length);
  
  console.log('[StorageService] Creating blob from base64 data, content length:', fileContent.length);
  
  try {
    // For React Native, use fetch with data URI
    // This is a workaround for the Blob constructor limitation
    const response = await fetch(`data:image/jpeg;base64,${fileContent}`);
    const blob = await response.blob();
    
    console.log('[StorageService] Native blob created successfully:', { 
      size: blob.size, 
      type: blob.type,
      sizeInKB: Math.round(blob.size / 1024)
    });
    return blob;
  } catch (blobError) {
    console.error('[StorageService] Failed to create blob from base64:', blobError);
    throw new Error(`Failed to create blob: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`);
  }
};

/**
 * Pick images from the device library
 * @param multiple Allow multiple image selection
 * @returns An array of selected image assets
 */
export const pickImages = async (multiple = true) => {
  // Request permission to access the media library
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }

  // Launch the image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    quality: 0.8,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets;
};

/**
 * Pick a video from the device library
 * @returns A single video asset or null if canceled
 */
export const pickVideo = async () => {
  // Request permission to access the media library
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }

  // Launch the video picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: true,
    quality: 0.8,
    videoMaxDuration: 60, // Max 60 seconds
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
};

/**
 * Upload an array of image assets to Firebase Storage
 * @param images Array of image assets selected with ImagePicker
 * @param path Storage path (e.g., 'users/userId/services/serviceId/images')
 * @returns Array of download URLs for the uploaded images
 */
export const uploadServiceImages = async (
  images: ImagePicker.ImagePickerAsset[],
  artistId: string,
  serviceId: string
): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  
  // Check authentication state before upload
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  
  console.log('[StorageService] Starting uploadServiceImages:', {
    imageCount: images.length,
    artistId,
    serviceId,
    imageUris: images.map(img => img.uri),
    isAuthenticated: !!currentUser,
    currentUserId: currentUser?.uid,
    expectedUserId: artistId,
    userIdMatch: currentUser?.uid === artistId
  });
  
  if (!currentUser) {
    console.error('[StorageService] CRITICAL: User is not authenticated!');
    throw new Error('User must be authenticated to upload images');
  }
  
  if (currentUser.uid !== artistId) {
    console.error('[StorageService] CRITICAL: User ID mismatch!', {
      currentUserId: currentUser.uid,
      artistId: artistId
    });
    throw new Error('User ID does not match artist ID');
  }
  
  try {
    // Process each image sequentially
    for (const image of images) {
      console.log('[StorageService] Processing image:', {
        uri: image.uri,
        fileName: image.fileName,
        width: image.width,
        height: image.height
      });
      
      // Create a unique filename using timestamp and original name or a random ID
      const filename = `${Date.now()}-${image.fileName || Math.random().toString(36).substring(2)}`;
      const path = `users/${artistId}/services/${serviceId}/images/${filename}`;
      
      console.log('[StorageService] Uploading to path:', path);
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      console.log('[StorageService] Storage reference created, starting upload...');
      
      // For React Native, use fetch with file URI to create blob
      // This avoids the need to create a blob from base64 data
      if (Platform.OS !== 'web') {
        console.log('[StorageService] Using fetch with file URI for native upload');
        
        // Use fetch to get the blob directly from the file URI
        const response = await fetch(image.uri);
        const blob = await response.blob();
        
        console.log('[StorageService] Blob created from file URI:', {
          blobSize: blob.size,
          blobType: blob.type
        });
        
        console.log('[StorageService] Upload details:', {
          blobSize: blob.size,
          blobType: blob.type,
          storagePath: path,
          bucket: storage.app.options.storageBucket
        });
        
        // Upload the image
        const uploadTask = uploadBytesResumable(storageRef, blob);
        
        // Wait for the upload to complete
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // You can track progress here if needed
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`[StorageService] Upload is ${progress}% done`);
            },
            (error) => {
              // Handle unsuccessful uploads with detailed error info
              console.error('[StorageService] Upload failed with error:', {
                code: error.code,
                message: error.message,
                serverResponse: error.serverResponse,
                name: error.name,
                customData: error.customData
              });
              
              // Log specific error types
              if (error.code === 'storage/unauthorized') {
                console.error('[StorageService] AUTHORIZATION ERROR: User does not have permission to upload to this path');
              } else if (error.code === 'storage/canceled') {
                console.error('[StorageService] Upload was canceled');
              } else if (error.code === 'storage/unknown') {
                console.error('[StorageService] Unknown error occurred - check network connectivity and Firebase project configuration');
              } else if (error.code === 'storage/invalid-format') {
                console.error('[StorageService] Invalid file format');
              } else if (error.code === 'storage/invalid-argument') {
                console.error('[StorageService] Invalid argument passed to upload');
              }
              
              reject(error);
            },
            () => {
              console.log('[StorageService] Upload completed successfully');
              resolve();
            }
          );
        });
        
        // Get the download URL and add it to the array
        console.log('[StorageService] Getting download URL...');
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log('[StorageService] Download URL obtained:', downloadURL);
        uploadedUrls.push(downloadURL);
        
        // Clean up the blob to avoid memory leaks
        if (Platform.OS !== 'web') {
          // @ts-ignore - Type definition might be missing but this is needed to prevent memory leaks
          blob.close?.();
        }
      } else {
        // For web, use the blob approach
        const blob = await uriToBlob(image.uri);
        console.log('[StorageService] Blob created successfully:', {
          blobSize: blob.size,
          blobType: blob.type
        });
        
        console.log('[StorageService] Upload details:', {
          blobSize: blob.size,
          blobType: blob.type,
          storagePath: path,
          bucket: storage.app.options.storageBucket
        });
        
        // Upload the image
        const uploadTask = uploadBytesResumable(storageRef, blob);
        
        // Wait for the upload to complete
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // You can track progress here if needed
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`[StorageService] Upload is ${progress}% done`);
            },
            (error) => {
              // Handle unsuccessful uploads with detailed error info
              console.error('[StorageService] Upload failed with error:', {
                code: error.code,
                message: error.message,
                serverResponse: error.serverResponse,
                name: error.name,
                customData: error.customData
              });
              
              // Log specific error types
              if (error.code === 'storage/unauthorized') {
                console.error('[StorageService] AUTHORIZATION ERROR: User does not have permission to upload to this path');
              } else if (error.code === 'storage/canceled') {
                console.error('[StorageService] Upload was canceled');
              } else if (error.code === 'storage/unknown') {
                console.error('[StorageService] Unknown error occurred - check network connectivity and Firebase project configuration');
              } else if (error.code === 'storage/invalid-format') {
                console.error('[StorageService] Invalid file format');
              } else if (error.code === 'storage/invalid-argument') {
                console.error('[StorageService] Invalid argument passed to upload');
              }
              
              reject(error);
            },
            () => {
              console.log('[StorageService] Upload completed successfully');
              resolve();
            }
          );
        });
        
        // Get the download URL and add it to the array
        console.log('[StorageService] Getting download URL...');
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log('[StorageService] Download URL obtained:', downloadURL);
        uploadedUrls.push(downloadURL);
        
        // Clean up the blob to avoid memory leaks
        if (Platform.OS !== 'web') {
          // @ts-ignore - Type definition might be missing but this is needed to prevent memory leaks
          blob.close?.();
        }
      }
    }
    
    return uploadedUrls;
  } catch (error) {
    console.error('[StorageService] Error uploading images:', error);
    
    // Log additional context for debugging
    if (error instanceof Error) {
      console.error('[StorageService] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message === 'Network request failed') {
      console.error('[StorageService] NETWORK ERROR DETECTED!');
      console.error('[StorageService] Possible causes:');
      console.error('[StorageService] 1. No internet connection');
      console.error('[StorageService] 2. Firebase Storage bucket not accessible');
      console.error('[StorageService] 3. CORS configuration issue');
      console.error('[StorageService] 4. Firebase project not properly configured');
      console.error('[StorageService] 5. Storage rules blocking the upload');
    }
    
    throw error;
  }
};

/**
 * Delete an image from Firebase Storage
 * @param url The full URL of the image to delete
 */
export const deleteServiceImage = async (url: string): Promise<void> => {
  try {
    // Extract the storage path from the URL
    const storageRef = ref(storage, url);
    // Use the correct method from firebase/storage to delete
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Upload a video to Firebase Storage
 * @param video Video asset selected with ImagePicker
 * @param artistId ID of the artist
 * @param serviceId ID of the service
 * @returns Download URL for the uploaded video
 */
export const uploadServiceVideo = async (
  video: ImagePicker.ImagePickerAsset,
  artistId: string,
  serviceId: string
): Promise<string> => {
  // Check authentication state before upload
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  
  console.log('[StorageService] Starting uploadServiceVideo:', {
    artistId,
    serviceId,
    videoUri: video.uri,
    isAuthenticated: !!currentUser,
    currentUserId: currentUser?.uid,
    expectedUserId: artistId,
    userIdMatch: currentUser?.uid === artistId
  });
  
  if (!currentUser) {
    console.error('[StorageService] CRITICAL: User is not authenticated!');
    throw new Error('User must be authenticated to upload videos');
  }
  
  if (currentUser.uid !== artistId) {
    console.error('[StorageService] CRITICAL: User ID mismatch!', {
      currentUserId: currentUser.uid,
      artistId: artistId
    });
    throw new Error('User ID does not match artist ID');
  }
  
  try {
    // Create a unique filename using timestamp
    const filename = `${Date.now()}-${video.fileName || Math.random().toString(36).substring(2)}`;
    const path = `users/${artistId}/services/${serviceId}/videos/${filename}`;
    
    console.log('[StorageService] Uploading video to path:', path);
    
    // Create storage reference
    const storageRef = ref(storage, path);
    
    // Use fetch to get the blob directly from the file URI
    const response = await fetch(video.uri);
    const blob = await response.blob();
    
    console.log('[StorageService] Video blob created:', {
      blobSize: blob.size,
      blobType: blob.type
    });
    
    // Upload the video
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Wait for the upload to complete
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`[StorageService] Video upload is ${progress}% done`);
        },
        (error) => {
          console.error('[StorageService] Video upload failed with error:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse,
            name: error.name,
            customData: error.customData
          });
          reject(error);
        },
        () => {
          console.log('[StorageService] Video upload completed successfully');
          resolve();
        }
      );
    });
    
    // Get the download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    console.log('[StorageService] Video download URL obtained:', downloadURL);
    
    // Clean up the blob to avoid memory leaks
    if (Platform.OS !== 'web') {
      // @ts-ignore - Type definition might be missing but this is needed to prevent memory leaks
      blob.close?.();
    }
    
    return downloadURL;
  } catch (error) {
    console.error('[StorageService] Error uploading video:', error);
    throw error;
  }
};

/**
 * Delete a video from Firebase Storage
 * @param url The full URL of the video to delete
 */
export const deleteServiceVideo = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};
