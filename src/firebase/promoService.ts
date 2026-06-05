import { collection, getDocs, getFirestore, query, Timestamp, where } from 'firebase/firestore';
import app from './firebaseConfig';

/**
 * Checks if a promo code is valid and returns its discount value (in MAD).
 * @param code The promo code string
 * @param serviceId Optional service ID to validate against
 * @param orderValue Optional order value for minimum order validation
 * @returns {Promise<number>} Discount value if valid, 0 if invalid
 */
export const validatePromoCode = async (
  code: string,
  serviceId?: string,
  orderValue?: number
): Promise<number> => {
  const db = getFirestore(app);
  const upperCode = code.trim().toUpperCase();

  console.log('🔍 Validating promo code:', upperCode, 'for service:', serviceId, 'order value:', orderValue);

  try {
    // First try with query (this might require an index)
    let coupon = null;
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', upperCode));
      const querySnapshot = await getDocs(q);
      console.log('📊 Query approach - results:', querySnapshot.size, 'documents found');

      if (!querySnapshot.empty) {
        coupon = querySnapshot.docs[0].data();
      }
    } catch (queryError) {
      console.warn('⚠️ Query failed, trying alternative approach:', queryError);
    }

    // If query failed or returned no results, try getting all coupons and filtering
    if (!coupon) {
      console.log('🔄 Trying alternative: fetching all coupons...');
      const allCouponsSnapshot = await getDocs(collection(db, 'coupons'));
      console.log('📊 All coupons count:', allCouponsSnapshot.size);

      for (const doc of allCouponsSnapshot.docs) {
        const couponData = doc.data();
        console.log('🔍 Checking coupon:', couponData.code, 'vs', upperCode);
        if (couponData.code === upperCode) {
          coupon = couponData;
          console.log('✅ Found matching coupon via alternative method');
          break;
        }
      }
    }

    if (!coupon) {
      console.log('❌ No coupon found with code:', upperCode);
      return 0;
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      console.log('❌ Coupon is not active');
      return 0;
    }

    // Check if coupon has expired
    const expiryDate = coupon.expiryDate instanceof Timestamp
      ? coupon.expiryDate.toDate()
      : new Date(coupon.expiryDate);

    console.log('📅 Expiry date:', expiryDate, 'Current date:', new Date());

    if (expiryDate <= new Date()) {
      console.log('❌ Coupon has expired');
      return 0;
    }

    // Check if coupon has remaining uses
    console.log('🔢 Current uses:', coupon.currentUses, 'Max uses:', coupon.maxUses);
    if (coupon.currentUses >= coupon.maxUses) {
      console.log('❌ Coupon usage limit reached');
      return 0;
    }

    // Check if service matches (if serviceId provided)
    if (serviceId && coupon.serviceId !== serviceId) {
      console.log('❌ Service mismatch. Coupon serviceId:', coupon.serviceId, 'Required serviceId:', serviceId);
      return 0;
    }

    // Check minimum order value (if provided)
    if (orderValue !== undefined && orderValue < coupon.minOrderValue) {
      console.log('❌ Order value too low. Required min:', coupon.minOrderValue, 'Order value:', orderValue);
      return 0;
    }

    // Return discount value
    const discountValue = typeof coupon.discountValue === 'number' ? coupon.discountValue : 0;
    console.log('✅ Coupon valid! Discount value:', discountValue);
    return discountValue;

  } catch (error) {
    console.error('❌ Error validating promo code:', error);
    return 0;
  }
};
