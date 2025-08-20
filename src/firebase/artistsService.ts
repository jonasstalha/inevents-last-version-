/**
 * Add a new ticket to Firestore under the artist's account
 */
export const addTicketToFirebase = async (artistId: string, ticket: any) => {
  try {
    console.log('[addTicketToFirebase] Called with artistId:', artistId, 'ticket:', ticket);
    const db = getFirestore();
    const ticketsRef = collection(db, 'users', artistId, 'tickets');
    const newTicket = {
      ...ticket,
      createdAt: serverTimestamp(),
      artistId,
    };
    const docRef = await addDoc(ticketsRef, newTicket);
    console.log('[addTicketToFirebase] Ticket added with ID:', docRef.id);
    return { id: docRef.id, ...newTicket };
  } catch (error) {
    console.error('[addTicketToFirebase] Error adding ticket to Firebase:', error);
    throw error;
  }
};

/**
 * Update or set user personal info in Firestore
 */
export const setUserPersonalInfo = async (artistId: string, info: any) => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', artistId);
    await setDoc(userRef, info, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user personal info:', error);
    throw error;
  }
};
import { addDoc, collection, doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
/**
 * Add a new service or ticket to Firestore under the artist's account
 */
export const addServiceToFirebase = async (artistId: string, service: any) => {
  try {
    console.log('[addServiceToFirebase] Called with artistId:', artistId, 'service:', service);
    const db = getFirestore();
    const servicesRef = collection(db, 'users', artistId, 'services');
    const newService = {
      ...service,
      createdAt: serverTimestamp(),
      artistId,
    };
    const docRef = await addDoc(servicesRef, newService);
    console.log('[addServiceToFirebase] Service added with ID:', docRef.id);
    return { id: docRef.id, ...newService };
  } catch (error) {
    console.error('[addServiceToFirebase] Error adding service to Firebase:', error);
    throw error;
  }
};
/**
 * Firebase Artists Service
 * Fetches real artists from Firestore users collection
 */

import { getDocs, query, where } from 'firebase/firestore';
import { Artist } from '../models/types';

const db = getFirestore();

/**
 * Fetch all users with role 'artist' from Firebase
 */
export const fetchArtistsFromFirebase = async (): Promise<Artist[]> => {
  try {
    console.log('🎨 Fetching artists from Firebase...');
    
    // Query users collection for artists (role === '(artist)')
    const usersRef = collection(db, 'users');
    const artistsQuery = query(usersRef, where('role', '==', '(artist)'));
    const querySnapshot = await getDocs(artistsQuery);
    
    if (querySnapshot.empty) {
      console.log('⚠️ No artists found in Firebase');
      return [];
    }
    
    const artists: Artist[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`👨‍🎨 Processing artist: ${userData.name}`);
      
      // Use real profile image if available, otherwise use default placeholder
      const artistName = userData.name || userData.fullName || userData.displayName || 'Professional Artist';
      const profileImage = userData.profileImage || 
                          userData.image || 
                          userData.avatar || 
                          generateArtistImage(artistName);
      
      // Transform Firebase user data to Artist format
      const artist: Artist = {
        id: doc.id,
        email: userData.email || '',
        name: artistName,
        role: 'artist',
        profileImage: profileImage,
        bio: generateArtistBio(userData.specialization, userData),
        storeId: userData.storeId || `store-${doc.id}`,
        rating: userData.rating || generateRandomRating(),
        categories: parseCategories(userData.specialization, userData.categories),
        location: formatLocation(userData.region, userData.location, userData.city, userData.country),
        featured: userData.featured || userData.isVerified || Math.random() > 0.7,
        createdAt: userData.signupDate?.toDate() || userData.createdAt?.toDate() || new Date(),
      };
      
      artists.push(artist);
    });
    
    console.log(`✅ Successfully fetched ${artists.length} artists from Firebase`);
    return artists;
    
  } catch (error) {
    console.error('❌ Error fetching artists from Firebase:', error);
    throw error;
  }
};

/**
 * Generate a default placeholder image for artists without profile pictures
 * Creates a colored avatar with the first letter of their name
 */
const generateArtistImage = (name?: string): string => {
  if (!name) {
    name = 'A'; // Default fallback
  }
  
  const firstLetter = name.charAt(0).toUpperCase();
  
  // Generate a consistent color based on the first letter
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  
  const colorIndex = firstLetter.charCodeAt(0) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  // Create avatar URL with UI Avatars service
  return `https://ui-avatars.com/api/?name=${firstLetter}&background=${backgroundColor.substring(1)}&color=fff&size=400&font-size=0.6&bold=true`;
};

/**
 * Generate professional bio based on specialization and user data
 */
const generateArtistBio = (specialization?: string, userData?: any): string => {
  // Use real bio from Firebase if available
  if (userData?.bio && userData.bio.trim().length > 10) {
    return userData.bio;
  }
  
  if (userData?.description && userData.description.trim().length > 10) {
    return userData.description;
  }
  
  // Professional bio templates based on specialization
  const bioTemplates = {
    'Corporate Events': [
      'Professional event organizer with extensive experience in corporate functions, conferences, and business gatherings. Specializing in seamless execution and memorable experiences.',
      'Expert in corporate event planning with a proven track record of delivering high-quality business events, team building activities, and professional conferences.',
      'Dedicated corporate event specialist focused on creating impactful business experiences through meticulous planning and attention to detail.',
    ],
    'Wedding Planning': [
      'Passionate wedding planner committed to making your special day absolutely perfect. With years of experience creating magical moments and stress-free celebrations.',
      'Expert wedding coordinator specializing in creating dream weddings that reflect each couple\'s unique love story and vision.',
      'Professional wedding planner with a keen eye for detail and a passion for bringing couples\' dream weddings to life with elegance and style.',
    ],
    'Audio/Visual Services': [
      'Professional A/V technician providing cutting-edge sound and visual solutions for events of all sizes. Ensuring crystal-clear audio and stunning visuals.',
      'Expert in audio-visual technology with extensive experience in live events, conferences, and entertainment productions.',
      'Specialized A/V professional dedicated to delivering high-quality technical solutions that enhance every event experience.',
    ],
    'Catering': [
      'Master chef and catering specialist creating exceptional culinary experiences for all types of events and celebrations.',
      'Professional caterer with expertise in diverse cuisines and dietary requirements, ensuring delicious food for every occasion.',
      'Experienced culinary artist specializing in event catering with a passion for creating memorable dining experiences.',
    ],
    'Photography': [
      'Professional photographer capturing beautiful, candid moments and creating lasting memories for weddings, events, and special occasions.',
      'Expert photographer with an artistic eye for detail, specializing in event photography and creating stunning visual stories.',
      'Passionate photographer dedicated to preserving life\'s most precious moments through creative and professional imagery.',
    ],
    'Music': [
      'Talented musician and performer bringing energy and entertainment to events with live music and professional stage presence.',
      'Professional musician with extensive experience in live performances, specializing in creating the perfect atmosphere for any event.',
      'Versatile musical artist offering live entertainment solutions for weddings, parties, and corporate events.',
    ],
    'Entertainment': [
      'Professional entertainer dedicated to bringing joy, laughter, and unforgettable experiences to events of all sizes.',
      'Expert performer specializing in interactive entertainment that engages audiences and creates lasting memories.',
      'Dynamic entertainer with a passion for creating fun, engaging experiences that delight guests of all ages.',
    ],
    'Decoration': [
      'Creative decorator and designer transforming spaces into beautiful, themed environments that perfectly match your vision.',
      'Professional event decorator with an artistic flair for creating stunning visual displays and ambiances.',
      'Expert in event styling and decoration, specializing in creating breathtaking atmospheres for memorable celebrations.',
    ],
  };
  
  const templates = bioTemplates[specialization as keyof typeof bioTemplates];
  if (templates) {
    // Use specialization and name to pick a consistent template
    const hash = (specialization || '').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return templates[Math.abs(hash) % templates.length];
  }
  
  return `Professional ${specialization || 'service provider'} with extensive experience in event services and customer satisfaction. Committed to delivering exceptional results for every client.`;
};

/**
 * Parse categories from specialization or categories field
 */
const parseCategories = (specialization?: string, categories?: string[] | string): string[] => {
  if (categories) {
    if (Array.isArray(categories)) {
      return categories;
    }
    if (typeof categories === 'string') {
      return [categories];
    }
  }
  
  if (specialization) {
    // Map specializations to categories
    const categoryMap: { [key: string]: string[] } = {
      'Corporate Events': ['Business', 'Corporate'],
      'Wedding Planning': ['Weddings', 'Planning'],
      'Audio/Visual Services': ['Technology', 'A/V'],
      'Catering': ['Food', 'Catering'],
      'Photography': ['Photography', 'Visual Arts'],
      'Music': ['Music', 'Entertainment'],
      'Entertainment': ['Entertainment', 'Performance'],
      'Decoration': ['Decoration', 'Design'],
    };
    
    return categoryMap[specialization] || [specialization];
  }
  
  return ['General Services'];
};

/**
 * Format location from multiple possible fields
 */
const formatLocation = (region?: string, location?: string, city?: string, country?: string): string => {
  const locationParts = [];
  
  if (city) locationParts.push(city);
  if (region && region !== city) locationParts.push(region);
  if (country && country !== region) locationParts.push(country);
  if (location && !locationParts.includes(location)) locationParts.push(location);
  
  if (locationParts.length === 0) {
    return 'Location Available Upon Request';
  }
  
  return locationParts.slice(0, 2).join(', '); // Limit to 2 parts for cleaner display
};

/**
 * Generate random rating between 4.0 and 5.0
 */
const generateRandomRating = (): number => {
  return Math.round((4.0 + Math.random() * 1.0) * 10) / 10;
};

/**
 * Fetch single artist by ID
 */
export const fetchArtistById = async (artistId: string): Promise<Artist | null> => {
  try {
    console.log(`🔍 Fetching artist ${artistId} from Firebase...`);
    
    const usersRef = collection(db, 'users');
    const artistQuery = query(usersRef, where('id', '==', artistId));
    const querySnapshot = await getDocs(artistQuery);
    
    if (querySnapshot.empty) {
      console.log(`⚠️ Artist ${artistId} not found`);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const userData = doc.data();
    
    // Use real profile image if available, otherwise use default placeholder
    const artistName = userData.name || userData.fullName || userData.displayName || 'Professional Artist';
    const profileImage = userData.profileImage || 
                        userData.image || 
                        userData.avatar || 
                        generateArtistImage(artistName);
    
    const artist: Artist = {
      id: doc.id,
      email: userData.email || '',
      name: artistName,
      role: 'artist',
      profileImage: profileImage,
      bio: generateArtistBio(userData.specialization, userData),
      storeId: userData.storeId || `store-${doc.id}`,
      rating: userData.rating || generateRandomRating(),
      categories: parseCategories(userData.specialization, userData.categories),
      location: formatLocation(userData.region, userData.location, userData.city, userData.country),
      featured: userData.featured || userData.isVerified || false,
      createdAt: userData.signupDate?.toDate() || userData.createdAt?.toDate() || new Date(),
    };
    
    console.log(`✅ Found artist: ${artist.name}`);
    return artist;
    
  } catch (error) {
    console.error(`❌ Error fetching artist ${artistId}:`, error);
    return null;
  }
};
