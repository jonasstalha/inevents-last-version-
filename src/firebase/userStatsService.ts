import { collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';
import app from './firebaseConfig';
import { getUserRewards } from './rewardsService';

const db = getFirestore(app);

export interface UserStats {
  orders: number;
  tickets: number;
  points: number;
  totalSpent: number;
  userId?: string;
  email?: string;
  name?: string;
  lastUpdated?: Date;
  level?: number;
  levelName?: string;
  nextLevelPoints?: number;
}

/**
 * Fetch user statistics from Firebase collections
 */
export const fetchUserStatistics = async (userId: string): Promise<UserStats> => {
  try {
    // Fetch orders from user's orders subcollection (not global collection)
    const ordersQuery = query(
      collection(db, 'users', userId, 'orders')
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fetch tickets from user's tickets subcollection
    const ticketsQuery = query(
      collection(db, 'users', userId, 'tickets')
    );
    const ticketsSnapshot = await getDocs(ticketsQuery);
    const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate statistics
    const confirmedOrders = orders.filter((order: any) => 
      order.status === 'confirmed' || order.status === 'completed'
    );
    
    const totalSpent = confirmedOrders.reduce((sum: number, order: any) => {
      const amount = typeof order.totalPrice === 'number' ? order.totalPrice :
                     typeof order.total === 'number' ? order.total : 
                     parseFloat(order.totalPrice || order.total || '0') || 0;
      return sum + amount;
    }, 0);
    
    // Get rewards data from the new rewards system
    const rewardsData = await getUserRewards(userId);
    
    return {
      orders: confirmedOrders.length,
      tickets: tickets.length,
      points: rewardsData?.totalPoints || 0,
      totalSpent: totalSpent,
      level: rewardsData?.level || 1,
      levelName: rewardsData?.levelName || 'Bronze Explorer',
      nextLevelPoints: rewardsData?.nextLevelPoints || 500,
    };
    
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw error;
  }
};

/**
 * Save user statistics to Firebase
 */
export const saveUserStatistics = async (userId: string, stats: UserStats, userInfo?: { email?: string; name?: string }): Promise<void> => {
  try {
    const userStatsRef = doc(db, 'userStatistics', userId);
    await setDoc(userStatsRef, {
      ...stats,
      userId,
      lastUpdated: new Date(),
      ...(userInfo && { email: userInfo.email, name: userInfo.name })
    }, { merge: true });
    
    console.log('✅ User statistics saved successfully');
  } catch (error) {
    console.error('❌ Error saving user statistics:', error);
    throw error;
  }
};

/**
 * Load stored statistics from Firebase
 */
export const loadStoredStatistics = async (userId: string): Promise<UserStats | null> => {
  try {
    const userStatsRef = doc(db, 'userStatistics', userId);
    const userStatsSnap = await getDoc(userStatsRef);
    
    if (userStatsSnap.exists()) {
      const data = userStatsSnap.data();
      return {
        orders: data.orders || 0,
        tickets: data.tickets || 0,
        points: data.points || 0,
        totalSpent: data.totalSpent || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error loading stored statistics:', error);
    return null;
  }
};

/**
 * Update statistics after a purchase is made
 */
export const updateStatisticsAfterPurchase = async (
  userId: string, 
  orderData: { total: number | string; type?: 'order' | 'ticket' }
): Promise<UserStats> => {
  try {
    // Get current stats
    const currentStats = await loadStoredStatistics(userId) || {
      orders: 0,
      tickets: 0,
      points: 0,
      totalSpent: 0
    };
    
    const orderAmount = typeof orderData.total === 'number' ? orderData.total : parseFloat(orderData.total) || 0;
    const isTicketPurchase = orderData.type === 'ticket';
    
    // Calculate new points based on purchase type
    const newOrderPoints = isTicketPurchase ? 0 : 10; // 10 points per service order
    const newTicketPoints = isTicketPurchase ? 5 : 0; // 5 points per ticket
    const newSpendingPoints = Math.floor(orderAmount / 10); // 1 point per 10 MAD spent
    
    const updatedStats: UserStats = {
      orders: currentStats.orders + (isTicketPurchase ? 0 : 1),
      tickets: currentStats.tickets + (isTicketPurchase ? 1 : 0),
      points: currentStats.points + newOrderPoints + newTicketPoints + newSpendingPoints,
      totalSpent: currentStats.totalSpent + orderAmount
    };
    
    // Save updated stats
    await saveUserStatistics(userId, updatedStats);
    
    return updatedStats;
    
  } catch (error) {
    console.error('Error updating statistics after purchase:', error);
    throw error;
  }
};

/**
 * Award bonus points to user (for promotions, achievements, etc.)
 */
export const awardBonusPoints = async (userId: string, points: number, reason?: string): Promise<UserStats> => {
  try {
    const currentStats = await loadStoredStatistics(userId) || {
      orders: 0,
      tickets: 0,
      points: 0,
      totalSpent: 0
    };
    
    const updatedStats: UserStats = {
      ...currentStats,
      points: currentStats.points + points
    };
    
    await saveUserStatistics(userId, updatedStats);
    
    console.log(`✅ Awarded ${points} bonus points to user ${userId}. Reason: ${reason || 'Bonus'}`);
    
    return updatedStats;
    
  } catch (error) {
    console.error('Error awarding bonus points:', error);
    throw error;
  }
};

/**
 * Get user statistics with real-time calculation
 */
export const getUserStatistics = async (userId: string): Promise<UserStats> => {
  try {
    // Always fetch fresh data for accurate statistics
    const freshStats = await fetchUserStatistics(userId);
    
    // Save the fresh stats
    await saveUserStatistics(userId, freshStats);
    
    return freshStats;
  } catch (error) {
    console.error('Error getting user statistics:', error);
    // Fallback to stored stats if fresh fetch fails
    const storedStats = await loadStoredStatistics(userId);
    return storedStats || { orders: 0, tickets: 0, points: 0, totalSpent: 0 };
  }
};

/**
 * Recalculate and fix user statistics from existing data
 * This function will scan all existing orders and tickets and recalculate points
 */
export const recalculateUserStatistics = async (userId: string): Promise<UserStats> => {
  try {
    console.log(`🔄 Recalculating statistics for user: ${userId}`);

    // Get fresh statistics by re-scanning all data
    const freshStats = await fetchUserStatistics(userId);
    
    // Force save the corrected statistics
    await saveUserStatistics(userId, freshStats);
    
    console.log('✅ Statistics recalculated and saved:', freshStats);
    return freshStats;
    
  } catch (error) {
    console.error('❌ Error recalculating user statistics:', error);
    throw error;
  }
};

/**
 * Debug function to check where user data is stored
 */
export const debugUserDataLocations = async (userId: string) => {
  try {
    console.log(`🔍 Debugging data locations for user: ${userId}`);
    
    // Check user's orders subcollection
    const userOrdersRef = collection(db, 'users', userId, 'orders');
    const userOrdersSnapshot = await getDocs(userOrdersRef);
    console.log(`📦 Found ${userOrdersSnapshot.docs.length} orders in users/${userId}/orders`);
    
    // Check user's tickets subcollection  
    const userTicketsRef = collection(db, 'users', userId, 'tickets');
    const userTicketsSnapshot = await getDocs(userTicketsRef);
    console.log(`🎫 Found ${userTicketsSnapshot.docs.length} tickets in users/${userId}/tickets`);
    
    // Check if orders exist in global collection
    try {
      const globalOrdersQuery = query(
        collection(db, 'orders'),
        where('clientId', '==', userId)
      );
      const globalOrdersSnapshot = await getDocs(globalOrdersQuery);
      console.log(`🌐 Found ${globalOrdersSnapshot.docs.length} orders in global orders collection`);
    } catch (error) {
      console.log('⚠️  No access to global orders collection');
    }
    
    // Check if tickets exist in global collection
    try {
      const globalTicketsQuery = query(
        collection(db, 'userTickets'),
        where('userId', '==', userId)
      );
      const globalTicketsSnapshot = await getDocs(globalTicketsQuery);
      console.log(`🌐 Found ${globalTicketsSnapshot.docs.length} tickets in global userTickets collection`);
    } catch (error) {
      console.log('⚠️  No access to global userTickets collection');
    }
    
    return {
      userOrders: userOrdersSnapshot.docs.length,
      userTickets: userTicketsSnapshot.docs.length
    };
    
  } catch (error) {
    console.error('❌ Error debugging user data locations:', error);
    return null;
  }
};
