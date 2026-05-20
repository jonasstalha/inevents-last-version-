import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import app from './firebaseConfig';
import { awardCustomOrderPoints } from './rewardsService';

/**
 * Create a custom service order (offer) from client to artist.
 * @param orderData { clientId, artistId, serviceId, clientPrice, realPrice, message, status, createdAt, clientInfo, customization, priceProposal, personalInfo }
 */
export const createCustomServiceOrder = async (orderData: {
  clientId: string;
  artistId: string;
  serviceId: string;
  serviceName?: string;
  clientPrice: number;
  realPrice: number;
  message: string;
  status?: string;
  clientInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  customization?: {
    eventDate: string;
    eventTime: string;
    duration: string;
    location: string;
    guestCount: string;
    specificRequests: string;
  };
  priceProposal?: {
    proposedPrice: string;
    budgetRange: string;
    priceJustification: string;
  };
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    additionalNotes: string;
  };
}) => {
  const db = getFirestore(app);
  const data = {
    ...orderData,
    status: orderData.status || 'pending',
    createdAt: serverTimestamp(),
    // Save detailed form data
    customization: orderData.customization || null,
    priceProposal: orderData.priceProposal || null,
    personalInfo: orderData.personalInfo || null,
  };
  
  // Save to global custom orders collection
  const clientOrderDoc = await addDoc(collection(db, 'customOrders'), data);
  
  // Save to global incoming custom orders collection for artist notifications
  await addDoc(collection(db, 'incomingCustomOrders'), {
    ...data,
    orderId: clientOrderDoc.id,
  });

  // Award points for custom order
  try {
    await awardCustomOrderPoints(
      orderData.clientId,
      clientOrderDoc.id,
      orderData.serviceName || 'Custom Service',
      orderData.clientPrice
    );
    console.log(`✅ Awarded points for custom order: ${clientOrderDoc.id}`);
  } catch (pointsError) {
    console.error('Failed to award points for custom order:', pointsError);
    // Don't throw this error as it's not critical to order creation
  }

  return clientOrderDoc.id;
};

/**
 * Get custom service orders for the current client
 * @returns Promise with array of custom service orders
 */
export const getClientCustomOrders = async () => {
  try {
    const { getAuth, getFirestore } = await import('firebase/auth');
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    const app = (await import('./firebaseConfig')).default;

    const db = getFirestore(app);
    const auth = getAuth(app);

    if (!auth.currentUser) {
      throw new Error('User is not authenticated');
    }

    const clientId = auth.currentUser.uid;

    // Query custom orders where clientId matches
    const customOrdersRef = collection(db, 'customOrders');
    const q = query(customOrdersRef, where('clientId', '==', clientId));
    const customOrdersSnapshot = await getDocs(q);

    return customOrdersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching client custom orders:', error);
    throw error;
  }
};

/**
 * Get a specific custom order by ID
 * @param orderId The custom order ID to retrieve
 * @returns The custom order data or null if not found
 */
export const getCustomOrderById = async (orderId: string) => {
  try {
    const { getAuth, getFirestore } = await import('firebase/auth');
    const { doc, getDoc } = await import('firebase/firestore');
    const app = (await import('./firebaseConfig')).default;

    const db = getFirestore(app);
    const auth = getAuth(app);

    if (!auth.currentUser) {
      throw new Error('User is not authenticated');
    }

    const customOrderRef = doc(db, 'customOrders', orderId);
    const customOrderDoc = await getDoc(customOrderRef);

    if (customOrderDoc.exists()) {
      return {
        id: customOrderDoc.id,
        ...customOrderDoc.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching custom order:', error);
    throw error;
  }
};
