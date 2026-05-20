import { addDoc, collection, doc, getDoc, getDocs, increment, orderBy, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Rewards configuration
export const REWARDS_CONFIG = {
  ORDER_POINTS: 50,        // Points per order
  TICKET_POINTS: 25,       // Points per ticket
  SERVICE_ORDER_POINTS: 75, // Points per service order
  CUSTOM_ORDER_POINTS: 100, // Points per custom order
  REVIEW_POINTS: 10,       // Points per review
  REFERRAL_POINTS: 200,    // Points per referral
};

export interface RewardTransaction {
  id?: string;
  userId: string;
  type: 'order' | 'ticket' | 'service_order' | 'custom_order' | 'review' | 'referral' | 'redemption';
  points: number;
  description: string;
  relatedId?: string; // Order ID, Ticket ID, etc.
  timestamp: Date;
  metadata?: {
    orderAmount?: number;
    ticketPrice?: number;
    serviceName?: string;
    [key: string]: any;
  };
}

export interface UserRewards {
  userId: string;
  totalPoints: number;
  lifetimePoints: number;
  level: number;
  levelName: string;
  nextLevelPoints: number;
  lastUpdated: Date;
}

// Reward levels
const REWARD_LEVELS = [
  { level: 1, name: 'Bronze Explorer', minPoints: 0, maxPoints: 499 },
  { level: 2, name: 'Silver Adventurer', minPoints: 500, maxPoints: 999 },
  { level: 3, name: 'Gold Enthusiast', minPoints: 1000, maxPoints: 1999 },
  { level: 4, name: 'Platinum VIP', minPoints: 2000, maxPoints: 4999 },
  { level: 5, name: 'Diamond Elite', minPoints: 5000, maxPoints: 9999 },
  { level: 6, name: 'Crystal Legend', minPoints: 10000, maxPoints: Infinity },
];

/**
 * Calculate user level based on total points
 */
export function calculateUserLevel(totalPoints: number) {
  const level = REWARD_LEVELS.find(l => totalPoints >= l.minPoints && totalPoints <= l.maxPoints) || REWARD_LEVELS[0];
  const nextLevel = REWARD_LEVELS.find(l => l.level === level.level + 1);
  
  return {
    level: level.level,
    levelName: level.name,
    nextLevelPoints: nextLevel ? nextLevel.minPoints - totalPoints : 0,
    isMaxLevel: !nextLevel,
  };
}

/**
 * Get user rewards data
 */
export async function getUserRewards(userId: string): Promise<UserRewards | null> {
  try {
    const userRewardsRef = doc(db, 'userRewards', userId);
    const userRewardsSnap = await getDoc(userRewardsRef);
    
    if (userRewardsSnap.exists()) {
      const data = userRewardsSnap.data();
      const levelInfo = calculateUserLevel(data.totalPoints);
      
      return {
        userId,
        totalPoints: data.totalPoints || 0,
        lifetimePoints: data.lifetimePoints || 0,
        level: levelInfo.level,
        levelName: levelInfo.levelName,
        nextLevelPoints: levelInfo.nextLevelPoints,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    }
    
    // Create initial rewards record if it doesn't exist
    const initialRewards: UserRewards = {
      userId,
      totalPoints: 0,
      lifetimePoints: 0,
      level: 1,
      levelName: 'Bronze Explorer',
      nextLevelPoints: 500,
      lastUpdated: new Date(),
    };
    
    await setDoc(userRewardsRef, {
      ...initialRewards,
      lastUpdated: Timestamp.fromDate(initialRewards.lastUpdated),
    });
    
    return initialRewards;
  } catch (error) {
    console.error('Error getting user rewards:', error);
    return null;
  }
}

/**
 * Add points to user account
 */
export async function addPoints(
  userId: string, 
  points: number, 
  type: RewardTransaction['type'], 
  description: string,
  relatedId?: string,
  metadata?: RewardTransaction['metadata']
): Promise<boolean> {
  try {
    console.log(`Adding ${points} points to user ${userId} for ${type}`);
    
    // Add transaction record
    const transaction: Omit<RewardTransaction, 'id'> = {
      userId,
      type,
      points,
      description,
      relatedId,
      timestamp: new Date(),
      metadata,
    };
    
    const transactionsRef = collection(db, 'rewardTransactions');
    await addDoc(transactionsRef, {
      ...transaction,
      timestamp: Timestamp.fromDate(transaction.timestamp),
    });
    
    // Update user rewards
    const userRewardsRef = doc(db, 'userRewards', userId);
    const userRewardsSnap = await getDoc(userRewardsRef);
    
    if (userRewardsSnap.exists()) {
      // Update existing record
      await updateDoc(userRewardsRef, {
        totalPoints: increment(points),
        lifetimePoints: increment(points),
        lastUpdated: Timestamp.fromDate(new Date()),
      });
    } else {
      // Create new record
      const levelInfo = calculateUserLevel(points);
      await setDoc(userRewardsRef, {
        totalPoints: points,
        lifetimePoints: points,
        level: levelInfo.level,
        levelName: levelInfo.levelName,
        lastUpdated: Timestamp.fromDate(new Date()),
      });
    }
    
    console.log(`Successfully added ${points} points to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error adding points:', error);
    return false;
  }
}

/**
 * Award points for order completion
 */
export async function awardOrderPoints(
  userId: string, 
  orderId: string, 
  orderAmount: number
): Promise<boolean> {
  const points = REWARDS_CONFIG.ORDER_POINTS;
  const description = `Earned ${points} points for completing order #${orderId.slice(-6)}`;
  
  return await addPoints(
    userId, 
    points, 
    'order', 
    description, 
    orderId,
    { orderAmount }
  );
}

/**
 * Award points for ticket purchase
 */
export async function awardTicketPoints(
  userId: string, 
  ticketId: string, 
  ticketPrice: number,
  eventName?: string
): Promise<boolean> {
  const points = REWARDS_CONFIG.TICKET_POINTS;
  const description = `Earned ${points} points for purchasing ticket${eventName ? ` to ${eventName}` : ''}`;
  
  return await addPoints(
    userId, 
    points, 
    'ticket', 
    description, 
    ticketId,
    { ticketPrice, eventName }
  );
}

/**
 * Award points for service order
 */
export async function awardServiceOrderPoints(
  userId: string, 
  serviceOrderId: string, 
  serviceName: string,
  orderAmount?: number
): Promise<boolean> {
  const points = REWARDS_CONFIG.SERVICE_ORDER_POINTS;
  const description = `Earned ${points} points for ordering ${serviceName}`;
  
  return await addPoints(
    userId, 
    points, 
    'service_order', 
    description, 
    serviceOrderId,
    { serviceName, orderAmount }
  );
}

/**
 * Award points for custom order
 */
export async function awardCustomOrderPoints(
  userId: string, 
  customOrderId: string, 
  serviceName: string,
  orderAmount?: number
): Promise<boolean> {
  const points = REWARDS_CONFIG.CUSTOM_ORDER_POINTS;
  const description = `Earned ${points} points for custom order: ${serviceName}`;
  
  return await addPoints(
    userId, 
    points, 
    'custom_order', 
    description, 
    customOrderId,
    { serviceName, orderAmount }
  );
}

/**
 * Get user reward transactions
 */
export async function getUserTransactions(
  userId: string, 
  limit: number = 20
): Promise<RewardTransaction[]> {
  try {
    const transactionsRef = collection(db, 'rewardTransactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const transactions: RewardTransaction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        points: data.points,
        description: data.description,
        relatedId: data.relatedId,
        timestamp: data.timestamp?.toDate() || new Date(),
        metadata: data.metadata,
      });
    });
    
    return transactions.slice(0, limit);
  } catch (error: any) {
    if (error.message?.includes('index')) {
      console.warn('[getUserTransactions] Index building, returning empty list.');
    } else {
      console.error('Error getting user transactions:', error);
    }
    return [];
  }
}

/**
 * Redeem points (for future features like discounts)
 */
export async function redeemPoints(
  userId: string, 
  points: number, 
  description: string,
  rewardId?: string
): Promise<boolean> {
  try {
    // Check if user has enough points
    const userRewards = await getUserRewards(userId);
    if (!userRewards || userRewards.totalPoints < points) {
      console.log('Insufficient points for redemption');
      return false;
    }
    
    // Deduct points (negative transaction)
    return await addPoints(
      userId, 
      -points, 
      'redemption', 
      description, 
      rewardId
    );
  } catch (error) {
    console.error('Error redeeming points:', error);
    return false;
  }
}

/**
 * Get rewards summary for admin/analytics
 */
export async function getRewardsSummary() {
  try {
    // This would be used for admin dashboard
    const transactionsRef = collection(db, 'rewardTransactions');
    const querySnapshot = await getDocs(transactionsRef);
    
    let totalPointsAwarded = 0;
    let totalTransactions = 0;
    const typeBreakdown: Record<string, number> = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalPointsAwarded += data.points;
      totalTransactions++;
      
      if (data.type in typeBreakdown) {
        typeBreakdown[data.type] += data.points;
      } else {
        typeBreakdown[data.type] = data.points;
      }
    });
    
    return {
      totalPointsAwarded,
      totalTransactions,
      typeBreakdown,
    };
  } catch (error) {
    console.error('Error getting rewards summary:', error);
    return null;
  }
}