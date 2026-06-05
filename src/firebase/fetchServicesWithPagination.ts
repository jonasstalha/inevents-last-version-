import { collection, getDocs, getDoc, doc, getFirestore, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import app from './firebaseConfig';

const getMainItemsTotal = (serviceData: any): number => {
  if (!Array.isArray(serviceData?.items) || serviceData.items.length === 0) {
    return Number(serviceData?.price ?? serviceData?.basePrice ?? 0) || 0;
  }

  const total = serviceData.items.reduce((sum: number, item: any) => {
    const itemPrice = Number(item?.price ?? 0);
    return sum + (Number.isFinite(itemPrice) ? itemPrice : 0);
  }, 0);

  return total > 0 ? total : Number(serviceData?.price ?? serviceData?.basePrice ?? 0) || 0;
};

export interface ServiceFilters {
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  region?: string;
  category?: string;
}

// Transform service data with ratings
const transformServiceWithRating = async (db: any, serviceDoc: any) => {
  const serviceData: any = {
    id: serviceDoc.id,
    ...serviceDoc.data(),
    userId: serviceDoc.ref.parent.parent?.id || null,
  };

  const normalizedMainItemsTotal = getMainItemsTotal(serviceData);
  serviceData.price = normalizedMainItemsTotal;
  serviceData.basePrice = normalizedMainItemsTotal;
  
  // Fetch artist info to get store name
  let artistName = 'Service Provider';
  try {
    const artistRef = doc(db, 'users', serviceData.userId);
    const artistSnap = await getDoc(artistRef);
    if (artistSnap.exists()) {
      const artistData = artistSnap.data();
      artistName = artistData.storeName || artistData.name || artistData.displayName || 'Service Provider';
    }
  } catch (error) {
    console.error('Error fetching artist data for service:', serviceDoc.id, error);
  }
  
  serviceData.artistName = artistName;
  
  try {
    const commentsRef = collection(db, 'users', serviceData.userId, 'services', serviceDoc.id, 'comments');
    const commentsSnap = await getDocs(commentsRef);
    
    let totalRating = 0;
    let totalRaters = 0;
    const comments: any[] = [];
    
    commentsSnap.forEach(commentDoc => {
      const commentData = commentDoc.data();
      comments.push({ id: commentDoc.id, ...commentData });
      
      if (typeof commentData.rating === 'number' && commentData.rating >= 1 && commentData.rating <= 5) {
        totalRating += commentData.rating;
        totalRaters++;
      }
    });
    
    serviceData.comments = comments;
    serviceData.totalRating = totalRating;
    serviceData.totalRaters = totalRaters;
    serviceData.ordersCount = serviceData.ordersCount || 0;
  } catch (error) {
    console.error('Error fetching comments for service:', serviceDoc.id, error);
    serviceData.comments = [];
    serviceData.totalRating = 0;
    serviceData.totalRaters = 0;
    serviceData.ordersCount = 0;
  }
  
  return serviceData;
};

// Fetch services with pagination across users using per-user subcollection queries.
// Returns { services, lastDoc, hasMore }
// Now supports filtering by price, rating, region, and category
export const fetchServicesWithPaginationFromFirebase = async (
  pageSize: number = 10,
  lastDoc?: any,
  filters?: ServiceFilters
) => {
  const db = getFirestore(app);
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  const userIds = usersSnap.docs.map(userDoc => userDoc.id);

  // Morocco regions mapping
  const moroccoRegions: { [key: string]: string[] } = {
    'Tanger-Tétouan-Al Hoceïma': ['Tanger', 'Tétouan', 'Al Hoceïma', 'Fnideq', 'Martil', 'Mdiq', 'Ksar El Kébir', 'Larache'],
    "L'Oriental": ['Oujda', 'Nador', 'Berkane', 'Al Hoceima', 'Taourirt', 'Jerada', 'Farkhana'],
    'Fès-Meknès': ['Fès', 'Meknès', 'Taza', 'Ifrane', 'Sefrou', 'Moulay Yaacoub', 'El Hajeb'],
    'Rabat-Salé-Kénitra': ['Rabat', 'Salé', 'Kénitra', 'Skhirate', 'Témara', 'Khémisset', 'Sidi Slimane', 'Sidi Kacem'],
    'Béni Mellal-Khénifra': ['Béni Mellal', 'Khénifra', 'Khouribga', 'Fquih Ben Salah', 'Azilal', 'Demnate'],
    'Casablanca-Settat': ['Casablanca', 'Marrakech', 'El Jadida', 'Settat', 'Berrechid', 'Beni Mellal'],
    'Marrakech-Safi': ['Marrakech', 'Safi', 'Essaouira', 'El Jadida', 'El Kelaa des Sraghna', 'Essaouira', 'Chichaoua'],
    'Drâa-Tafilalet': ['Ouarzazate', 'Errachidia', 'Zagora', 'Tinghir', 'Boumalne Dadès', 'Marrakech'],
    'Souss-Massa': ['Agadir', 'Inezgane', 'Tiznit', 'Guelmim', 'Taroudant', 'Chtouka Aït Baha', 'Tata'],
    'Guelmim-Oued Noun': ['Guelmim', 'Laâyoune', 'Dakhla', 'Assaguia', 'Awsard'],
    'Laâyoune-Sakia El Hamra': ['Laâyoune', 'Dakhla', 'Boujdour', 'Smara'],
    'Dakhla-Oued Ed-Dahab': ['Dakhla', 'Oued Ed-Dahab', 'Aousserd'],
  };

  let currentUserIndex = 0;
  let lastSnapshot: any = null;

  if (lastDoc) {
    currentUserIndex = typeof lastDoc.userIndex === 'number' ? lastDoc.userIndex : 0;
    lastSnapshot = lastDoc.snapshot || null;
  }

  const allServices: any[] = [];
  let nextLastDoc: any = null;
  
  // Continue fetching until we have enough services or run out of users
  while (allServices.length < pageSize && currentUserIndex < userIds.length) {
    const userId = userIds[currentUserIndex];
    const servicesRef = collection(db, 'users', userId, 'services');
    const remaining = pageSize - allServices.length;
    
    let q;
    if (lastSnapshot) {
      q = query(servicesRef, orderBy('createdAt', 'desc'), startAfter(lastSnapshot), limit(remaining));
    } else {
      q = query(servicesRef, orderBy('createdAt', 'desc'), limit(remaining));
    }

    const servicesSnap = await getDocs(q);
    if (servicesSnap.empty) {
      lastSnapshot = null;
      currentUserIndex++;
      continue;
    }

    for (const serviceDoc of servicesSnap.docs) {
      if (allServices.length >= pageSize) break;
      
      const transformedService = await transformServiceWithRating(db, serviceDoc);
      
      // Apply filters
      let passesFilters = true;
      
      // Price filter (basePrice)
      if (filters?.priceMin !== undefined) {
        const price = parseFloat(transformedService.basePrice) || 0;
        if (price < filters.priceMin) passesFilters = false;
      }
      if (filters?.priceMax !== undefined) {
        const price = parseFloat(transformedService.basePrice) || 0;
        if (price > filters.priceMax) passesFilters = false;
      }
      
      // Rating filter - show exact star range (e.g., 4 shows 4.0-4.9)
      if (filters?.minRating !== undefined && filters.minRating > 0) {
        const rating = transformedService.totalRaters > 0 
          ? transformedService.totalRating / transformedService.totalRaters 
          : 0;
        if (rating < filters.minRating || rating >= filters.minRating + 1) passesFilters = false;
      }
      
      // Region filter
      if (filters?.region) {
        const serviceLocation = (transformedService.city || transformedService.location || '').toLowerCase();
        const regionCities = moroccoRegions[filters.region] || [];
        const matchesRegion = regionCities.some(city => 
          serviceLocation.includes(city.toLowerCase())
        );
        if (!matchesRegion && serviceLocation !== '') {
          passesFilters = false;
        }
      }
      
      // Category filter
      if (filters?.category && filters.category !== 'All') {
        const serviceCategory = (transformedService.category || '').toLowerCase();
        if (serviceCategory !== filters.category.toLowerCase()) passesFilters = false;
      }
      
      if (passesFilters) {
        allServices.push(transformedService);
      }
    }

    if (servicesSnap.docs.length > 0) {
      lastSnapshot = servicesSnap.docs[servicesSnap.docs.length - 1];
      nextLastDoc = {
        userIndex: currentUserIndex,
        snapshot: lastSnapshot,
      };
    }

    if (allServices.length < pageSize) {
      // Move to next user if we couldn't get enough from current user
      if (servicesSnap.docs.length < remaining || servicesSnap.empty) {
        lastSnapshot = null;
        currentUserIndex++;
      } else {
        // We got full batch from this user but didn't add enough after filtering
        // Continue to next user
        currentUserIndex++;
        lastSnapshot = null;
      }
    }
  }

  const hasMore = allServices.length === pageSize || (currentUserIndex < userIds.length - 1);

  return {
    services: allServices,
    lastDoc: nextLastDoc,
    hasMore,
  };
};
