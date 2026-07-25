import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import app from './firebaseConfig';
import { getDocs, query, updateDoc, doc } from 'firebase/firestore';

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
  
  try {
    // Recompute service rating and review count and persist them
    const commentsQuery = query(collection(db, 'users', userId, 'services', serviceId, 'comments'));
    const commentsSnap = await getDocs(commentsQuery);
    const ratings = commentsSnap.docs.map(d => {
      const data = d.data() as any;
      return typeof data.rating === 'number' ? data.rating : (data.rating ? Number(data.rating) : 0);
    }).filter(r => !Number.isNaN(r));

    const reviewCount = ratings.length;
    const avg = reviewCount ? ratings.reduce((s, r) => s + r, 0) / reviewCount : 0;

    // Update service document with new aggregates
    const serviceRef = doc(db, 'users', userId, 'services', serviceId);
    await updateDoc(serviceRef, {
      rating: Number(avg.toFixed(1)),
      reviewCount,
      ratingUpdatedAt: new Date()
    });

    // Recompute artist overall rating by aggregating service ratings (weighted by reviewCount)
    const servicesRef = collection(db, 'users', userId, 'services');
    const servicesSnap = await getDocs(servicesRef);
    const serviceRatings: number[] = [];
    let totalWeight = 0;
    let weightedSum = 0;
    servicesSnap.docs.forEach(sdoc => {
      const sdata = sdoc.data() as any;
      const rCount = typeof sdata.reviewCount === 'number' ? sdata.reviewCount : parseInt(sdata.reviewCount) || 0;
      const r = typeof sdata.rating === 'number' ? sdata.rating : (sdata.rating ? Number(sdata.rating) : 0);
      if (rCount > 0) {
        weightedSum += r * rCount;
        totalWeight += rCount;
      } else if (r > 0) {
        weightedSum += r;
        totalWeight += 1;
      }
    });

    const artistAvg = totalWeight ? weightedSum / totalWeight : 0;
    const artistRef = doc(db, 'users', userId);
    await updateDoc(artistRef, {
      rating: Number(artistAvg.toFixed(1)),
      ratingUpdatedAt: new Date()
    });
  } catch (err) {
    console.warn('[reviewService] Failed updating aggregates after review:', err);
  }
};
