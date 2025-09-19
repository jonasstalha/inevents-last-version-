import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import app from './firebaseConfig';

/**
 * Add a review to a service in Firestore.
 * @param userId The user/artist ID who owns the service
 * @param serviceId The service ID
 * @param review { userId, userName, rating, text }
 */
export const addServiceReview = async (
  userId: string,
  serviceId: string,
  review: { userId: string; userName: string; rating: number; text: string }
) => {
  const db = getFirestore(app);
  const commentsRef = collection(db, 'users', userId, 'services', serviceId, 'comments');
  await addDoc(commentsRef, {
    ...review,
    createdAt: serverTimestamp(),
  });
};
