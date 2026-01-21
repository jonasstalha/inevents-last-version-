import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { Platform } from 'react-native';
import app from './firebaseConfig';

// Initialize Firebase Storage
const storage = getStorage(app);

/**
 * Convert an image URI to a blob for uploading to Firebase Storage
 * @param uri The local URI of the image
 * @returns A Promise resolving to a Blob
 */
const uriToBlob = async (uri: string): Promise<Blob> => {
  // On web, fetch the URI and get the blob directly
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return await response.blob();
  } 
  
  // On native platforms, use FileSystem to read the file
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist');
  }
  
  const fileContent = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  return fetch(`data:image/jpeg;base64,${fileContent}`).then(res => res.blob());
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
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: !multiple,
    allowsMultipleSelection: multiple,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets;
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
  
  try {
    // Process each image sequentially
    for (const image of images) {
      const blob = await uriToBlob(image.uri);
      
      // Create a unique filename using timestamp and original name or a random ID
      const filename = `${Date.now()}-${image.fileName || Math.random().toString(36).substring(2)}`;
      const path = `users/${artistId}/services/${serviceId}/images/${filename}`;
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Upload the image
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      // Wait for the upload to complete
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // You can track progress here if needed
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
          },
          (error) => {
            // Handle unsuccessful uploads
            console.error('Upload failed:', error);
            reject(error);
          },
          () => {
            resolve();
          }
        );
      });
      
      // Get the download URL and add it to the array
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      uploadedUrls.push(downloadURL);
      
      // Clean up the blob to avoid memory leaks
      if (Platform.OS !== 'web') {
        // @ts-ignore - Type definition might be missing but this is needed to prevent memory leaks
        blob.close?.();
      }
    }
    
    return uploadedUrls;
  } catch (error) {
    console.error('Error uploading images:', error);
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
