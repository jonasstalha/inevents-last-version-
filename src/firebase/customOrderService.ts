import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { createOrder } from './orderService';
import { db } from './firebaseConfig';
import { awardCustomOrderPoints } from './rewardsService';

export interface CustomServiceOrderInput {
  clientId: string;
  clientName?: string;
  clientPhoto?: string;
  artistId: string;
  artistName?: string;
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
}

export const createCustomServiceOrder = async (orderData: CustomServiceOrderInput) => {
  const orderId = await createOrder({
    clientId: orderData.clientId,
    clientName: orderData.clientName,
    clientPhoto: orderData.clientPhoto,
    artistId: orderData.artistId,
    artistName: orderData.artistName,
    serviceId: orderData.serviceId,
    serviceName: orderData.serviceName,
    description: orderData.message,
    type: 'service',
    totalPrice: orderData.clientPrice,
    currency: 'MAD',
    paymentStatus: 'unpaid',
    clientInfo: orderData.clientInfo,
    customization: orderData.customization,
    priceProposal: orderData.priceProposal,
    personalInfo: orderData.personalInfo,
    specialRequests: orderData.customization?.specificRequests,
  });

  try {
    await awardCustomOrderPoints(orderData.clientId, orderId, orderData.serviceName, orderData.clientPrice);
    console.log(`? Awarded points for custom order: ${orderId}`);
  } catch (pointsError) {
    console.error('Failed to award points for custom order:', pointsError);
  }

  return orderId;
};

export const getClientCustomOrders = async () => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User is not authenticated');
  }

  const clientId = auth.currentUser.uid;
  const customOrdersRef = collection(db, 'orders');
  const q = query(customOrdersRef, where('clientId', '==', clientId), where('type', '==', 'service'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
};

export const getCustomOrderById = async (orderId: string) => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User is not authenticated');
  }

  const orderRef = doc(db, 'orders', orderId);
  const orderSnapshot = await getDoc(orderRef);

  if (!orderSnapshot.exists()) {
    return null;
  }

  const data = orderSnapshot.data();
  if (data.type !== 'service') {
    return null;
  }

  return {
    id: orderSnapshot.id,
    ...data,
  };
};
