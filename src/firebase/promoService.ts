import { doc, getDoc, getFirestore } from 'firebase/firestore';
import app from './firebaseConfig';

/**
 * Checks if a promo code is valid and returns its discount value (in MAD).
 * @param code The promo code string
 * @returns {Promise<number>} Discount value if valid, 0 if invalid
 */
export const validatePromoCode = async (code: string): Promise<number> => {
  const db = getFirestore(app);
  const promoRef = doc(db, 'promoCodes', code.trim().toUpperCase());
  const promoSnap = await getDoc(promoRef);
  if (promoSnap.exists()) {
    const data = promoSnap.data();
    return typeof data.discount === 'number' ? data.discount : 0;
  }
  return 0;
};
