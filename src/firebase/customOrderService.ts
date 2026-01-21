import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import app from './firebaseConfig';
import { awardCustomOrderPoints } from './rewardsService';

/**
 * Create a custom service order (offer) from client to artist.
 * @param orderData { clientId, artistId, serviceId, clientPrice, realPrice, message, status, createdAt, clientInfo }
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
}) => {
  const db = getFirestore(app);
  const data = {
    ...orderData,
    status: orderData.status || 'pending',
    createdAt: serverTimestamp(),
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
