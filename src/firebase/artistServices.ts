import { collection, getDocs, getFirestore, query } from 'firebase/firestore';
import { Gig } from '../models/types';

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
