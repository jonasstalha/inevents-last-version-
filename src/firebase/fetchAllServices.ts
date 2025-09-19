import { collection, doc, getDoc, getDocs, getFirestore } from 'firebase/firestore';
import app from './firebaseConfig';

// Fetch all services from all users
export const fetchAllServicesFromFirebase = async () => {
  const db = getFirestore(app);
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  const allServices: any[] = [];
  for (const userDoc of usersSnap.docs) {
    const servicesRef = collection(db, 'users', userDoc.id, 'services');
    const servicesSnap = await getDocs(servicesRef);
    servicesSnap.forEach(serviceDoc => {
      allServices.push({ id: serviceDoc.id, ...serviceDoc.data(), userId: userDoc.id });
    });
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
        
        // Return service with comments and user info
        return { 
          id: serviceSnap.id, 
          ...serviceData, 
          userId: userDoc.id,
          comments: comments || []
        };
      } catch (error) {
        console.error("Error fetching comments:", error);
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
