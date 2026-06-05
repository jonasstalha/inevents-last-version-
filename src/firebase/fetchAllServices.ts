import { collection, doc, getDoc, getDocs, getFirestore } from 'firebase/firestore';
import app from './firebaseConfig';

const normalizeExtrasValue = (value: any): any[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).filter(Boolean);
  }
  return [];
};

const resolveServiceExtras = (data: any): any[] => {
  const candidates = [data?.extras, data?.addOns, data?.extraServices, data?.extraServicesList];
  for (const candidate of candidates) {
    const normalized = normalizeExtrasValue(candidate);
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return normalizeExtrasValue(data?.extras ?? data?.addOns ?? data?.extraServices ?? data?.extraServicesList);
};

// Fetch all services from all users
export const fetchAllServicesFromFirebase = async () => {
  const db = getFirestore(app);
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  const allServices: any[] = [];
  for (const userDoc of usersSnap.docs) {
    const servicesRef = collection(db, 'users', userDoc.id, 'services');
    const servicesSnap = await getDocs(servicesRef);
    for (const serviceDoc of servicesSnap.docs) {
      const serviceData: any = { id: serviceDoc.id, ...serviceDoc.data(), userId: userDoc.id };
      
      // Fetch comments to calculate rating
      try {
        const commentsRef = collection(db, 'users', userDoc.id, 'services', serviceDoc.id, 'comments');
        const commentsSnap = await getDocs(commentsRef);
        
        let totalRating = 0;
        let totalRaters = 0;
        const comments: any[] = [];
        
        commentsSnap.forEach(commentDoc => {
          const commentData = commentDoc.data();
          comments.push({ id: commentDoc.id, ...commentData });
          
          // Only count valid ratings (1-5)
          if (typeof commentData.rating === 'number' && commentData.rating >= 1 && commentData.rating <= 5) {
            totalRating += commentData.rating;
            totalRaters++;
          }
        });
        
        // Add calculated rating fields to service
        serviceData.comments = comments;
        serviceData.totalRating = totalRating;
        serviceData.totalRaters = totalRaters;
        serviceData.ordersCount = serviceData.ordersCount || 0;
        const normalizedExtras = Array.isArray(serviceData.extras)
          ? serviceData.extras
          : Array.isArray(serviceData.addOns)
            ? serviceData.addOns
            : Array.isArray(serviceData.extraServices)
              ? serviceData.extraServices
              : [];
        serviceData.extras = normalizedExtras;
        serviceData.addOns = Array.isArray(serviceData.addOns) ? serviceData.addOns : normalizedExtras;
        serviceData.extraServices = Array.isArray(serviceData.extraServices) ? serviceData.extraServices : normalizedExtras;
      } catch (error) {
        console.error("Error fetching comments for service:", serviceDoc.id, error);
        serviceData.comments = [];
        serviceData.totalRating = 0;
        serviceData.totalRaters = 0;
        serviceData.ordersCount = 0;
        const fallbackExtras = Array.isArray(serviceData.extras)
          ? serviceData.extras
          : Array.isArray(serviceData.addOns)
            ? serviceData.addOns
            : Array.isArray(serviceData.extraServices)
              ? serviceData.extraServices
              : [];
        serviceData.extras = fallbackExtras;
        serviceData.addOns = Array.isArray(serviceData.addOns) ? serviceData.addOns : fallbackExtras;
        serviceData.extraServices = Array.isArray(serviceData.extraServices) ? serviceData.extraServices : fallbackExtras;
      }
      
      allServices.push(serviceData);
    }
  }
  return allServices;
};

// Fetch a specific service by its ID
export const fetchServiceByIdFromFirebase = async (serviceId: string) => {
  const db = getFirestore(app);
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  
  // Since services are stored in subcollections under users, we need to search all users
  for (const userDoc of usersSnap.docs) {
    const serviceRef = doc(db, 'users', userDoc.id, 'services', serviceId);
    const serviceSnap = await getDoc(serviceRef);
    
    if (serviceSnap.exists()) {
      const serviceData = serviceSnap.data();
      
      // Fetch comments for this service if they exist
      try {
        const commentsRef = collection(db, 'users', userDoc.id, 'services', serviceId, 'comments');
        const commentsSnap = await getDocs(commentsRef);
        const comments = commentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Normalize extras/addOns and return service with comments and user info
        const normalizedExtras = resolveServiceExtras(serviceData);

        serviceData.extras = normalizedExtras;
        serviceData.addOns = normalizeExtrasValue(serviceData.addOns).length > 0
          ? normalizeExtrasValue(serviceData.addOns)
          : normalizedExtras;
        serviceData.extraServices = normalizeExtrasValue(serviceData.extraServices).length > 0
          ? normalizeExtrasValue(serviceData.extraServices)
          : normalizedExtras;
        return { 
          id: serviceSnap.id, 
          ...serviceData, 
          userId: userDoc.id,
          comments: comments || []
        };
      } catch (error) {
        console.error("Error fetching comments:", error);
        const fallbackExtras = Array.isArray(serviceData.extras)
          ? serviceData.extras
          : Array.isArray(serviceData.addOns)
            ? serviceData.addOns
            : Array.isArray(serviceData.extraServices)
              ? serviceData.extraServices
              : [];
        serviceData.extras = fallbackExtras;
        serviceData.addOns = Array.isArray(serviceData.addOns) ? serviceData.addOns : fallbackExtras;
        serviceData.extraServices = Array.isArray(serviceData.extraServices) ? serviceData.extraServices : fallbackExtras;
        // Still return the service even if comments fetch fails
        return { 
          id: serviceSnap.id, 
          ...serviceData, 
          userId: userDoc.id,
          comments: []
        };
      }
    }
  }
  
  // If no service found with the given ID
  throw new Error(`Service with ID ${serviceId} not found`);
};
