import { ImagePickerAsset } from 'expo-image-picker';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, updateDoc } from 'firebase/firestore';
import { Gig, GigInput } from '../models/types';
import { deleteServiceImage, deleteServiceVideo, uploadServiceImages, uploadServiceVideo } from './storageService';

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
      video: data.video,
      category: data.category || '',
      options: data.options || [],
      extras: data.extras || data.addOns || [],
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      orders: data.orders || [],
    });
  });
  return gigs;
};

/**
 * Create a new service with images and optional video for an artist
 * @param artistId ID of the artist creating the service
 * @param serviceData Service data
 * @param imageAssets Image assets to upload
 * @param videoAsset Optional video asset to upload
 * @returns The created service with images and video URLs
 */
export const createServiceWithImages = async (
  artistId: string,
  serviceData: GigInput,
  imageAssets: ImagePickerAsset[],
  videoAsset?: ImagePickerAsset | null
): Promise<Gig> => {
  const db = getFirestore();
  
  console.log('[ArtistServices] createServiceWithImages called:', {
    artistId,
    serviceData,
    imageCount: imageAssets.length,
    hasVideo: !!videoAsset
  });
  
  try {
    // First, create the service in Firestore to get the ID
    const serviceRef = collection(db, 'users', artistId, 'services');
    console.log('[ArtistServices] Creating Firestore document...');
    const docRef = await addDoc(serviceRef, {
      ...serviceData,
      artistId,
      createdAt: new Date(),
      rating: 0,
      reviewCount: 0,
      orders: [],
    });
    console.log('[ArtistServices] Firestore document created with ID:', docRef.id);
    
    // Now upload the images with the new service ID
    console.log('[ArtistServices] Starting image upload...');
    const imageUrls = await uploadServiceImages(imageAssets, artistId, docRef.id);
    console.log('[ArtistServices] Image upload completed, URLs:', imageUrls);
    
    // Upload video if provided
    let videoUrl: string | undefined;
    if (videoAsset) {
      console.log('[ArtistServices] Starting video upload...');
      videoUrl = await uploadServiceVideo(videoAsset, artistId, docRef.id);
      console.log('[ArtistServices] Video upload completed, URL:', videoUrl);
    }
    
    // Update the service with the image and video URLs and extras alias when present
    const updateData: any = { images: imageUrls };
    if (serviceData.extras !== undefined) {
      updateData.extras = serviceData.extras;
      updateData.addOns = serviceData.extras;
    }
    if (videoUrl) {
      updateData.video = videoUrl;
    }
    await updateDoc(docRef, updateData);
    
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
      video: updatedServiceData?.video || videoUrl,
      category: updatedServiceData?.category || serviceData.category,
      options: updatedServiceData?.options || serviceData.options,
      extras: updatedServiceData?.extras || serviceData.extras || [],
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
 * Update an existing service with new images and optional video
 * @param artistId ID of the artist who owns the service
 * @param serviceId ID of the service to update
 * @param serviceData Updated service data
 * @param newImageAssets New images to add
 * @param imagesToDelete URLs of images to delete
 * @param newVideoAsset Optional new video to upload
 * @param deleteVideo Whether to delete the existing video
 * @returns The updated service
 */
export const updateServiceWithImages = async (
  artistId: string,
  serviceId: string,
  serviceData: Partial<GigInput>,
  newImageAssets: ImagePickerAsset[] = [],
  imagesToDelete: string[] = [],
  newVideoAsset?: ImagePickerAsset | null,
  deleteVideo: boolean = false
): Promise<Gig> => {
  const db = getFirestore();
  
  console.log('[ArtistServices] updateServiceWithImages called:', {
    artistId,
    serviceId,
    serviceData,
    newImageCount: newImageAssets.length,
    imagesToDeleteCount: imagesToDelete.length,
    hasNewVideo: !!newVideoAsset,
    deleteVideo
  });
  
  try {
    const serviceRef = doc(db, 'users', artistId, 'services', serviceId);
    
    // Get current service data
    const serviceDoc = await getDoc(serviceRef);
    if (!serviceDoc.exists()) {
      throw new Error('Service not found');
    }
    
    const currentService = serviceDoc.data() as Gig;
    let updatedImages = [...(currentService.images || [])];
    let updatedVideo = currentService.video;
    
    // Delete images if specified
    for (const imageUrl of imagesToDelete) {
      console.log('[ArtistServices] Deleting image:', imageUrl);
      await deleteServiceImage(imageUrl);
      updatedImages = updatedImages.filter(url => url !== imageUrl);
    }
    
    // Delete video if specified
    if (deleteVideo && currentService.video) {
      console.log('[ArtistServices] Deleting video:', currentService.video);
      await deleteServiceVideo(currentService.video);
      updatedVideo = undefined;
    }
    
    // Upload new images
    if (newImageAssets.length > 0) {
      console.log('[ArtistServices] Uploading new images...');
      const newImageUrls = await uploadServiceImages(newImageAssets, artistId, serviceId);
      console.log('[ArtistServices] New images uploaded, URLs:', newImageUrls);
      updatedImages = [...updatedImages, ...newImageUrls];
    }
    
    // Upload new video if provided
    if (newVideoAsset) {
      console.log('[ArtistServices] Uploading new video...');
      // Delete old video if exists
      if (currentService.video) {
        console.log('[ArtistServices] Deleting old video:', currentService.video);
        await deleteServiceVideo(currentService.video);
      }
      updatedVideo = await uploadServiceVideo(newVideoAsset, artistId, serviceId);
      console.log('[ArtistServices] New video uploaded, URL:', updatedVideo);
    }
    
    // Update the service document
    const updateData: any = {
      ...serviceData,
      images: updatedImages,
    };
    if (serviceData.extras !== undefined) {
      updateData.addOns = serviceData.extras;
    }
    if (updatedVideo) {
      updateData.video = updatedVideo;
    } else if (deleteVideo) {
      updateData.video = null;
    }
    
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
      video: updatedServiceData?.video || updatedVideo,
      category: updatedServiceData?.category || currentService.category,
      options: updatedServiceData?.options || currentService.options,
      extras: updatedServiceData?.extras || serviceData.extras || currentService.extras || [],
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
 * Delete a service and all its associated images and video
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
    const video = serviceData.video;
    
    // Delete all images from storage
    for (const imageUrl of images) {
      await deleteServiceImage(imageUrl);
    }
    
    // Delete video if exists
    if (video) {
      await deleteServiceVideo(video);
    }
    
    // Delete the service document
    await deleteDoc(serviceRef);
  } catch (error) {
    console.error('Error deleting service with images:', error);
    throw error;
  }
};

// Fetch all orders for a given artist
export const fetchOrdersByArtistId = async (artistId: string): Promise<any[]> => {
  const db = getFirestore();
  const ordersRef = collection(db, 'users', artistId, 'orders');
  const q = query(ordersRef);
  const querySnapshot = await getDocs(q);
  const orders: any[] = [];
  querySnapshot.forEach((doc) => {
    orders.push({ id: doc.id, ...doc.data() });
  });
  return orders;
};
