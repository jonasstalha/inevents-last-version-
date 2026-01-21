import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, query, Timestamp, updateDoc, where } from 'firebase/firestore';

const db = getFirestore();

export interface Coupon {
  id?: string;
  code: string;
  serviceId: string;
  serviceName: string;
  artistId: string;
  artistName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  expiryDate: Date;
  createdAt: Date;
  description: string;
  minOrderValue: number;
}

export interface CouponUsage {
  id?: string;
  couponId: string;
  couponCode: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  orderId: string;
  discountAmount: number;
  usedAt: Date;
}

// Create a new coupon
export const createCoupon = async (couponData: Omit<Coupon, 'id' | 'createdAt' | 'currentUses'>): Promise<string> => {
  try {
    // Validate required fields
    if (!couponData.code || !couponData.serviceId || !couponData.artistId) {
      throw new Error('Missing required fields: code, serviceId, or artistId');
    }

    // Validate numeric values
    if (isNaN(couponData.discountValue) || couponData.discountValue <= 0) {
      throw new Error('Invalid discount value');
    }

    if (isNaN(couponData.maxUses) || couponData.maxUses <= 0) {
      throw new Error('Invalid max uses value');
    }

    // Ensure we have a valid Date object
    let expiryDate: Date;
    if (couponData.expiryDate instanceof Date) {
      expiryDate = couponData.expiryDate;
    } else {
      // This shouldn't happen with the new date picker, but just in case
      expiryDate = new Date(couponData.expiryDate);
    }

    // Validate the date
    if (isNaN(expiryDate.getTime())) {
      throw new Error('Invalid expiry date');
    }

    // Ensure the date is in the future
    if (expiryDate <= new Date()) {
      throw new Error('Expiry date must be in the future');
    }

    const coupon: Omit<Coupon, 'id'> = {
      ...couponData,
      expiryDate,
      currentUses: 0,
      createdAt: new Date(),
      // Ensure minOrderValue is never undefined - default to 0
      minOrderValue: couponData.minOrderValue || 0,
      // Ensure description is never undefined - default to empty string
      description: couponData.description || '',
    };

    console.log('Creating coupon with date:', expiryDate.toISOString());

    const docRef = await addDoc(collection(db, 'coupons'), {
      ...coupon,
      expiryDate: Timestamp.fromDate(expiryDate),
      createdAt: Timestamp.fromDate(coupon.createdAt),
    });

    console.log('Coupon created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
};

// Get coupons by artist ID
export const getCouponsByArtist = async (artistId: string): Promise<Coupon[]> => {
  try {
    const q = query(collection(db, 'coupons'), where('artistId', '==', artistId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expiryDate: data.expiryDate.toDate(),
        createdAt: data.createdAt.toDate(),
        description: data.description || '',
        minOrderValue: data.minOrderValue || 0,
      };
    }) as Coupon[];
  } catch (error) {
    console.error('Error fetching artist coupons:', error);
    throw error;
  }
};

// Get coupons by service ID
export const getCouponsByService = async (serviceId: string): Promise<Coupon[]> => {
  try {
    const q = query(
      collection(db, 'coupons'), 
      where('serviceId', '==', serviceId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      expiryDate: doc.data().expiryDate.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Coupon[];
  } catch (error) {
    console.error('Error fetching service coupons:', error);
    throw error;
  }
};

// Validate and apply coupon
export const validateCoupon = async (
  couponCode: string, 
  serviceId: string, 
  orderValue: number
): Promise<{
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  error?: string;
}> => {
  try {
    const q = query(
      collection(db, 'coupons'),
      where('code', '==', couponCode.toUpperCase()),
      where('serviceId', '==', serviceId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { isValid: false, error: 'Invalid coupon code' };
    }

    const couponDoc = querySnapshot.docs[0];
    const coupon = {
      id: couponDoc.id,
      ...couponDoc.data(),
      expiryDate: couponDoc.data().expiryDate.toDate(),
      createdAt: couponDoc.data().createdAt.toDate(),
    } as Coupon;

    // Check if coupon is expired
    if (new Date() > coupon.expiryDate) {
      return { isValid: false, error: 'Coupon has expired' };
    }

    // Check if coupon has reached max uses
    if (coupon.currentUses >= coupon.maxUses) {
      return { isValid: false, error: 'Coupon usage limit reached' };
    }

    // Check minimum order value
    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      return { 
        isValid: false, 
        error: `Minimum order value is ${coupon.minOrderValue} MAD` 
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderValue * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed order value
    discountAmount = Math.min(discountAmount, orderValue);

    return {
      isValid: true,
      coupon,
      discountAmount,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { isValid: false, error: 'Error validating coupon' };
  }
};

// Apply coupon (increment usage count and record usage)
export const applyCoupon = async (
  couponId: string,
  clientId: string,
  clientName: string,
  serviceId: string,
  orderId: string,
  discountAmount: number
): Promise<void> => {
  try {
    // Update coupon usage count
    const couponRef = doc(db, 'coupons', couponId);
    const couponDoc = await getDocs(query(collection(db, 'coupons'), where('__name__', '==', couponId)));
    
    if (!couponDoc.empty) {
      const currentCoupon = couponDoc.docs[0].data() as Coupon;
      await updateDoc(couponRef, {
        currentUses: currentCoupon.currentUses + 1,
      });
    }

    // Record coupon usage
    const usageData: Omit<CouponUsage, 'id'> = {
      couponId,
      couponCode: '', // Will be filled by the calling function
      clientId,
      clientName,
      serviceId,
      orderId,
      discountAmount,
      usedAt: new Date(),
    };

    await addDoc(collection(db, 'couponUsages'), {
      ...usageData,
      usedAt: Timestamp.fromDate(usageData.usedAt),
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    throw error;
  }
};

// Update coupon
export const updateCoupon = async (couponId: string, updates: Partial<Coupon>): Promise<void> => {
  try {
    const couponRef = doc(db, 'coupons', couponId);
    const updateData = { ...updates };
    
    // Convert dates to Firestore timestamps
    if (updateData.expiryDate) {
      (updateData as any).expiryDate = Timestamp.fromDate(updateData.expiryDate);
    }
    
    await updateDoc(couponRef, updateData);
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
};

// Delete coupon
export const deleteCoupon = async (couponId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'coupons', couponId));
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
};

// Get coupon usage statistics
export const getCouponUsageStats = async (couponId: string): Promise<CouponUsage[]> => {
  try {
    const q = query(collection(db, 'couponUsages'), where('couponId', '==', couponId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      usedAt: doc.data().usedAt.toDate(),
    })) as CouponUsage[];
  } catch (error) {
    console.error('Error fetching coupon usage stats:', error);
    throw error;
  }
};