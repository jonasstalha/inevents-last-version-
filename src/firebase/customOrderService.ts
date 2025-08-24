import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import app from './firebaseConfig';

/**
 * Create a custom service order (offer) from client to artist.
 * @param orderData { clientId, artistId, serviceId, clientPrice, realPrice, message, status, createdAt }
 */
export const createCustomServiceOrder = async (orderData: {
  clientId: string;
  artistId: string;
  serviceId: string;
  clientPrice: number;
  realPrice: number;
  message: string;
  status?: string;
}) => {
  const db = getFirestore(app);
  const data = {
    ...orderData,
    status: orderData.status || 'pending',
    createdAt: serverTimestamp(),
  };
  // Save to client's orders
  await addDoc(collection(db, 'users', orderData.clientId, 'custom_orders'), data);
  // Save to artist's incoming orders
  await addDoc(collection(db, 'users', orderData.artistId, 'incoming_custom_orders'), data);
};
