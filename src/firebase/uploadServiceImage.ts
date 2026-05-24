import * as FileSystem from 'expo-file-system';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app, { storage } from './firebaseConfig';
import { Platform } from 'react-native';

/**
 * Upload a single image URI to Firebase Storage and return its download URL.
 * Uses `uploadBytes` + `getDownloadURL` and falls back to `expo-file-system` when needed.
 */
export const uploadServiceImage = async (
  uri: string,
  userId: string,
  serviceId: string
): Promise<string> => {
  const auth = getAuth(app as any);
  const currentUser = auth.currentUser;
  console.log('[uploadServiceImage] called', { uri, userId, serviceId });

  if (!currentUser) throw new Error('User must be authenticated to upload images');
  if (currentUser.uid !== userId) console.warn('[uploadServiceImage] userId mismatch');

  try {
    // Generate filename with timestamp + random suffix + extension
    const guessedName = uri.split('/').pop() || `${Date.now()}`;
    const extMatch = guessedName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1]}` : '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    const path = `users/${userId}/services/${serviceId}/images/${filename}`;

    console.log('[uploadServiceImage] uploading to path:', path);
    const storageRef = ref(storage, path);

    // Attempt to fetch blob (works on many platforms)
    let blob: Blob | null = null;
    try {
      console.log('[uploadServiceImage] attempting fetch -> blob for uri');
      const resp = await fetch(uri);
      blob = await resp.blob();
      console.log('[uploadServiceImage] fetched blob', { size: (blob as any)?.size });
    } catch (fetchErr) {
      console.warn('[uploadServiceImage] fetch->blob failed, falling back to FileSystem', fetchErr);
    }

    // Fallback: read file as base64 and convert to blob using data: URI
    if (!blob) {
      console.log('[uploadServiceImage] using FileSystem fallback for uri:', uri, Platform.OS);
      const info = await FileSystem.getInfoAsync(uri, { size: false });
      if (!info.exists) throw new Error('File does not exist: ' + uri);
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      const resp = await fetch(dataUrl);
      blob = await resp.blob();
    }

    if (!blob) throw new Error('Failed to create blob for upload');

    // Upload using uploadBytes (not resumable) as requested
    console.log('[uploadServiceImage] calling uploadBytes');
    await uploadBytes(storageRef, blob);
    console.log('[uploadServiceImage] uploadBytes complete, fetching download URL');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[uploadServiceImage] downloadURL:', downloadURL);

    // Clean up blob if possible
    try {
      // @ts-ignore
      blob.close?.();
    } catch (e) {
      // ignore
    }

    return downloadURL;
  } catch (error) {
    console.error('[uploadServiceImage] error uploading image:', error);
    throw error;
  }
};

export default uploadServiceImage;
