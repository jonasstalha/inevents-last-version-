import { ImagePickerAsset } from 'expo-image-picker';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, updateDoc } from 'firebase/firestore';
import { Gig, GigInput } from '../models/types';
import { deleteServiceImage, uploadServiceImages } from './storageService';

// Fetch all services (gigs) for a given artist
export const fetchServicesByArtistId = async (artistId: string): Promise<Gig[]> => {
  const db = getFirestore();
  const servicesRef = collection(db, 'users', artistId, 'services');
  const q = query(servicesRef);
  const querySnapshot = await getDocs(q);
  const gigs: Gig[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    gigs.push({
      id: doc.id,
      artistId: artistId,
      title: data.title || '',
      description: data.description || '',
      basePrice: data.basePrice || 0,
      images: data.images || [],
      category: data.category || '',
      options: data.options || [],
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      orders: data.orders || [],
    });
  });
  return gigs;
};

/**
 * Create a new service with images for an artist
 * @param artistId ID of the artist creating the service
 * @param serviceData Service data
 * @param imageAssets Image assets to upload
 * @returns The created service with images URLs
 */
export const createServiceWithImages = async (
  artistId: string,
  serviceData: GigInput,
  imageAssets: ImagePickerAsset[]
): Promise<Gig> => {
  const db = getFirestore();
  
  try {
    // First, create the service in Firestore to get the ID
    const serviceRef = collection(db, 'users', artistId, 'services');
    const docRef = await addDoc(serviceRef, {
      ...serviceData,
      artistId,
      createdAt: new Date(),
      rating: 0,
      reviewCount: 0,
      orders: [],
    });
    
    // Now upload the images with the new service ID
    const imageUrls = await uploadServiceImages(imageAssets, artistId, docRef.id);
    
    // Update the service with the image URLs
    await updateDoc(docRef, {
      images: imageUrls
    });
    
    // Fetch the updated service
    const updatedServiceDoc = await getDoc(docRef);
    const updatedServiceData = updatedServiceDoc.data();
    
    // Return the complete service
    return {
      id: docRef.id,
      artistId,
      title: updatedServiceData?.title || serviceData.title,
      description: updatedServiceData?.description || serviceData.description,
      basePrice: updatedServiceData?.basePrice || serviceData.basePrice,
      images: updatedServiceData?.images || imageUrls,
      category: updatedServiceData?.category || serviceData.category,
      options: updatedServiceData?.options || serviceData.options,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      orders: [],
    };
  } catch (error) {
    console.error('Error creating service with images:', error);
    throw error;
  }
};

/**
 * Update an existing service with new images
 * @param artistId ID of the artist who owns the service
 * @param serviceId ID of the service to update
 * @param serviceData Updated service data
 * @param newImageAssets New images to add
 * @param imagesToDelete URLs of images to delete
 * @returns The updated service
 */
export const updateServiceWithImages = async (
  artistId: string,
  serviceId: string,
  serviceData: Partial<GigInput>,
  newImageAssets: ImagePickerAsset[] = [],
  imagesToDelete: string[] = []
): Promise<Gig> => {
  const db = getFirestore();
  
  try {
    const serviceRef = doc(db, 'users', artistId, 'services', serviceId);
    
    // Get current service data
    const serviceDoc = await getDoc(serviceRef);
    if (!serviceDoc.exists()) {
      throw new Error('Service not found');
    }
    
    const currentService = serviceDoc.data() as Gig;
    let updatedImages = [...(currentService.images || [])];
    
    // Delete images if specified
    for (const imageUrl of imagesToDelete) {
      await deleteServiceImage(imageUrl);
      updatedImages = updatedImages.filter(url => url !== imageUrl);
    }
    
    // Upload new images
    if (newImageAssets.length > 0) {
      const newImageUrls = await uploadServiceImages(newImageAssets, artistId, serviceId);
      updatedImages = [...updatedImages, ...newImageUrls];
    }
    
    // Update the service document
    const updateData = {
      ...serviceData,
      images: updatedImages,
    };
    
    await updateDoc(serviceRef, updateData);
    
    // Fetch the updated service
    const updatedServiceDoc = await getDoc(serviceRef);
    const updatedServiceData = updatedServiceDoc.data();
    
    return {
      id: serviceId,
      artistId,
      title: updatedServiceData?.title || currentService.title,
      description: updatedServiceData?.description || currentService.description,
      basePrice: updatedServiceData?.basePrice || currentService.basePrice,
      images: updatedServiceData?.images || updatedImages,
      category: updatedServiceData?.category || currentService.category,
      options: updatedServiceData?.options || currentService.options,
      rating: updatedServiceData?.rating || currentService.rating,
      reviewCount: updatedServiceData?.reviewCount || currentService.reviewCount,
      createdAt: updatedServiceData?.createdAt?.toDate ? updatedServiceData.createdAt.toDate() : currentService.createdAt,
      orders: updatedServiceData?.orders || currentService.orders,
    };
  } catch (error) {
    console.error('Error updating service with images:', error);
    throw error;
  }
};

/**
 * Delete a service and all its associated images
 * @param artistId ID of the artist who owns the service
 * @param serviceId ID of the service to delete
 */
export const deleteServiceWithImages = async (
  artistId: string,
  serviceId: string
): Promise<void> => {
  const db = getFirestore();
  
  try {
    const serviceRef = doc(db, 'users', artistId, 'services', serviceId);
    
    // Get current service data to access image URLs
    const serviceDoc = await getDoc(serviceRef);
    if (!serviceDoc.exists()) {
      throw new Error('Service not found');
    }
    
    const serviceData = serviceDoc.data();
    const images = serviceData.images || [];
    
    // Delete all images from storage
    for (const imageUrl of images) {
      await deleteServiceImage(imageUrl);
    }
    
    // Delete the service document
    await deleteDoc(serviceRef);
  } catch (error) {
    console.error('Error deleting service with images:', error);
    throw error;
  }
};
