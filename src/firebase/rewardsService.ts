/**
 * rewardsService.ts
 * ────────────────
 * Points / rewards engine — fully Firestore-driven.
 *
 * Firestore data-flow
 * ────────────────────
 * rewardTransactions/{doc}  ← one doc per points event
 * userRewards/{userId}      ← live balance, lifetime, level
 * pointsConfig/{rulesDoc}   ← point rules (editable in real-time; need an admin UI)
 */

import { addDoc, collection, doc, getDoc, getDocs, getFirestore, increment, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from './firebaseConfig';
import { getPointsConfig, PointsConfigResult, WritePointsConfig } from './pointsConfigService';

const db = getFirestore(app);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RewardTransaction {
  id?: string;
  userId: string;
  type: 'order' | 'ticket' | 'service_order' | 'custom_order' | 'review' | 'referral' | 'redemption';
  points: number;
  description: string;
  relatedId?: string;
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

// ─────────────────────────────────────────────────────────────────────────────
// Reward levels
// ─────────────────────────────────────────────────────────────────────────────

const REWARD_LEVELS = [
  { level: 1, name: 'Bronze Explorer',   minPoints: 0,    maxPoints: 499  },
  { level: 2, name: 'Silver Adventurer', minPoints: 500,  maxPoints: 999  },
  { level: 3, name: 'Gold Enthusiast',   minPoints: 1000, maxPoints: 1999 },
  { level: 4, name: 'Platinum VIP',      minPoints: 2000, maxPoints: 4999 },
  { level: 5, name: 'Diamond Elite',     minPoints: 5000, maxPoints: 9999 },
  { level: 6, name: 'Crystal Legend',    minPoints: 10000, maxPoints: Infinity },
];

// ─────────────────────────────────────────────────────────────────────────────
// In-memory rules cache (populated from Firestore)
// ─────────────────────────────────────────────────────────────────────────────

type CachedRules = {
  orderPoints:                number;
  ticketPoints:               number;
  serviceOrderPoints:         number;
  customOrderPoints:          number;
  serviceOrderSpendingPoints: number;
  ticketSpendingPoints:       number;
  spendingRatePerMad:         number;
  reviewPoints:               number;
  referralPoints:             number;
};

export let REWARDS_CONFIG: CachedRules = {
  orderPoints:                50,
  ticketPoints:               25,
  serviceOrderPoints:         75,
  customOrderPoints:          100,
  serviceOrderSpendingPoints: 10,
  ticketSpendingPoints:       5,
  spendingRatePerMad:         10,
  reviewPoints:               10,
  referralPoints:             200,
};

// Cache to prevent repeated loads
let _rewardsLoadInProgress = false;
let _rewardsLastLoaded = 0;
const REWARDS_CACHE_TTL = 60000; // 1 minute cache

/** Pull Firestore rules once. Call at app start or whenever you want to refresh rules. */
export async function loadRewardRules(): Promise<void> {
  // Return immediately if load is already in progress
  if (_rewardsLoadInProgress) {
    return;
  }

  // Return if cache is still valid
  const now = Date.now();
  if (_rewardsLastLoaded && (now - _rewardsLastLoaded) < REWARDS_CACHE_TTL) {
    return;
  }

  _rewardsLoadInProgress = true;
  try {
    const cfg: PointsConfigResult = await getPointsConfig();
    REWARDS_CONFIG = {
      orderPoints:                cfg.orderPoints,
      ticketPoints:               cfg.ticketPoints,
      serviceOrderPoints:         cfg.serviceOrderPoints,
      customOrderPoints:          cfg.customOrderPoints,
      serviceOrderSpendingPoints: cfg.serviceOrderSpendingPoints,
      ticketSpendingPoints:       cfg.ticketSpendingPoints,
      spendingRatePerMad:         cfg.spendingRatePerMad,
      reviewPoints:               cfg.reviewPoints,
      referralPoints:             cfg.referralPoints,
    };
    _rewardsLastLoaded = now;
    console.log('[rewardsService] Rules loaded from Firestore:', REWARDS_CONFIG);
  } catch (err) {
    console.warn('[rewardsService] Could not load Firestore rules; using defaults:', err);
  } finally {
    _rewardsLoadInProgress = false;
  }
}

/**
 * Subscribe to Firestore rule changes.
 * Returns an unsubscribe function.
 */
export function subscribeRewardRules(onNext: () => void): () => void {
  return getPointsConfig().then(() => onNext());
}

/** Expose the currently cached rules — call after `loadRewardRules()` first. */
export function getRewardRules() {
  return { ...REWARDS_CONFIG };
}

// ─────────────────────────────────────────────────────────────────────────────
// Level helpers
// ─────────────────────────────────────────────────────────────────────────────

export function calculateUserLevel(totalPoints: number) {
  const level =
    REWARD_LEVELS.find(
      (l) => totalPoints >= l.minPoints && totalPoints <= l.maxPoints
    ) || REWARD_LEVELS[0];
  const next =
    REWARD_LEVELS.find((l) => l.level === level.level + 1) || null;

  return {
    level: level.level,
    levelName: level.name,
    nextLevelPoints: next ? next.minPoints - totalPoints : 0,
    isMaxLevel: !next,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserRewards(userId: string): Promise<UserRewards | null> {
  try {
    const userRewardsRef = doc(db, 'userRewards', userId);
    const userRewardsSnap = await getDoc(userRewardsRef);

    if (userRewardsSnap.exists()) {
      const d = userRewardsSnap.data();
      const li = calculateUserLevel(d.totalPoints ?? 0);
      return {
        userId,
        totalPoints:    d.totalPoints    ?? 0,
        lifetimePoints: d.lifetimePoints ?? 0,
        level:          li.level,
        levelName:      li.levelName,
        nextLevelPoints: li.nextLevelPoints,
        lastUpdated:    (d.lastUpdated as any)?.toDate?.() ?? new Date(),
      };
    }

    // boot record
    const li = calculateUserLevel(0);
    await setDoc(
      doc(db, 'userRewards', userId),
      {
        userId,
        totalPoints:    0,
        lifetimePoints: 0,
        level:          li.level,
        levelName:      li.levelName,
        nextLevelPoints: li.nextLevelPoints,
        lastUpdated:    Timestamp.now(),
      },
      { merge: true },
    );

    return {
      userId,
      totalPoints:    0,
      lifetimePoints: 0,
      level:          li.level,
      levelName:      li.levelName,
      nextLevelPoints: li.nextLevelPoints,
      lastUpdated:    new Date(),
    };
  } catch (error) {
    console.error('Error getting user rewards:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add (or deduct) points from a user account and record the transaction.
 */
export async function addPoints(
  userId:    string,
  points:    number,
  type:      RewardTransaction['type'],
  description: string,
  relatedId?: string,
  metadata?:  RewardTransaction['metadata'],
): Promise<boolean> {
  try {
    // ── Transaction record ────────────────────────────────────────────────────
    const transaction: Omit<RewardTransaction, 'id'> = {
      userId,
      type,
      points,
      description,
      relatedId,
      timestamp: new Date(),
      metadata,
    };

    await addDoc(collection(db, 'rewardTransactions'), {
      ...transaction,
      timestamp: Timestamp.fromDate(transaction.timestamp),
    });

    // ── Update user rewards ───────────────────────────────────────────────────
    const userRewardsRef  = doc(db, 'userRewards', userId);
    const userRewardsSnap = await getDoc(userRewardsRef);

    if (userRewardsSnap.exists()) {
      await updateDoc(userRewardsRef, {
        totalPoints:     increment(points),
        lifetimePoints:  increment(points),
        lastUpdated:     Timestamp.now(),
      });
    } else {
      const li = calculateUserLevel(points);
      await setDoc(userRewardsRef, {
        userId,
        totalPoints:    points,
        lifetimePoints: points,
        level:          li.level,
        levelName:      li.levelName,
        nextLevelPoints: li.nextLevelPoints,
        lastUpdated:    Timestamp.now(),
      });
    }

    console.log(`✅ [addPoints] ${points} pts → user ${userId} (${type})`);
    return true;
  } catch (error) {
    console.error('Error adding points:', error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Award helpers — all read REWARDS_CONFIG which is sourced from Firestore
// ─────────────────────────────────────────────────────────────────────────────

export async function awardOrderPoints(
  userId:     string,
  orderId:    string,
  orderAmount: number,
): Promise<boolean> {
  const basePoints = REWARDS_CONFIG.orderPoints;
  const spendingPoints = Math.floor(orderAmount / REWARDS_CONFIG.spendingRatePerMad);
  const totalPts = basePoints + spendingPoints;
  const desc = `Earned ${basePoints} pts (order) + ${spendingPoints} pts (${orderAmount} MAD) = ${totalPts} pts total`;
  return addPoints(userId, totalPts, 'order', desc, orderId, { orderAmount, basePoints, spendingPoints });
}

export async function awardTicketPoints(
  userId:       string,
  ticketId:     string,
  ticketPrice:  number,
  eventName?:   string,
): Promise<boolean> {
  const basePoints = REWARDS_CONFIG.ticketPoints;
  const spendingPoints = Math.floor(ticketPrice / REWARDS_CONFIG.spendingRatePerMad);
  const totalPts = basePoints + spendingPoints;
  const desc = `Earned ${basePoints} pts (ticket) + ${spendingPoints} pts (${ticketPrice} MAD)${eventName ? ` for ${eventName}` : ''}`;
  return addPoints(userId, totalPts, 'ticket', desc, ticketId, { ticketPrice, eventName, basePoints, spendingPoints });
}

export async function awardServiceOrderPoints(
  userId:         string,
  serviceOrderId: string,
  serviceName:    string,
  orderAmount?:   number,
): Promise<boolean> {
  const basePoints = REWARDS_CONFIG.serviceOrderPoints;
  const spendingPoints = orderAmount ? Math.floor(orderAmount / REWARDS_CONFIG.spendingRatePerMad) : 0;
  const totalPts = basePoints + spendingPoints;
  const desc = `Earned ${basePoints} pts (service order: ${serviceName})${spendingPoints > 0 ? ` + ${spendingPoints} pts (${orderAmount} MAD)` : ''}`;
  return addPoints(userId, totalPts, 'service_order', desc, serviceOrderId, { serviceName, orderAmount, basePoints, spendingPoints });
}

export async function awardCustomOrderPoints(
  userId:         string,
  customOrderId:  string,
  serviceName:    string,
  orderAmount?:   number,
): Promise<boolean> {
  const basePoints = REWARDS_CONFIG.customOrderPoints;
  const spendingPoints = orderAmount ? Math.floor(orderAmount / REWARDS_CONFIG.spendingRatePerMad) : 0;
  const totalPts = basePoints + spendingPoints;
  const desc = `Earned ${basePoints} pts (custom order: ${serviceName})${spendingPoints > 0 ? ` + ${spendingPoints} pts (${orderAmount} MAD)` : ''}`;
  return addPoints(userId, totalPts, 'custom_order', desc, customOrderId, { serviceName, orderAmount, basePoints, spendingPoints });
}

export async function awardReviewPoints(
  userId:   string,
  reviewId: string,
  rating:   number,
): Promise<boolean> {
  const pts  = REWARDS_CONFIG.reviewPoints;
  const desc = `Earned ${pts} pts for leaving a review (${rating}★)`;
  return addPoints(userId, pts, 'review', desc, reviewId, { rating });
}

export async function awardReferralPoints(
  userId:       string,
  referralCode: string,
  referredUserId?: string,
): Promise<boolean> {
  const pts  = REWARDS_CONFIG.referralPoints;
  const desc = `Earned ${pts} pts for referring a friend`;
  return addPoints(userId, pts, 'referral', desc, referralCode, { referredUserId });
}

// ─────────────────────────────────────────────────────────────────────────────
// Read transaction history
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserTransactions(
  userId: string,
  limit:  number = 20,
): Promise<RewardTransaction[]> {
  try {
    const transactionsRef = collection(db, 'rewardTransactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
    );

    const snapshot = await getDocs(q);
    const result: RewardTransaction[] = [];

    snapshot.forEach((dc) => {
      const d = dc.data();
      result.push({
        id:         dc.id,
        userId:     d.userId,
        type:       d.type,
        points:     d.points,
        description: d.description,
        relatedId:  d.relatedId,
        timestamp:  (d.timestamp as any)?.toDate?.() ?? new Date(),
        metadata:   d.metadata,
      });
    });

    return result.slice(0, limit);
  } catch (error: any) {
    if (error.message?.includes('index')) {
      console.warn('[rewardsService] Index building; returning empty list.');
    } else {
      console.error('Error getting user transactions:', error);
    }
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Redemption
// ─────────────────────────────────────────────────────────────────────────────

export async function redeemPoints(
  userId:    string,
  points:    number,
  description: string,
  rewardId?: string,
): Promise<boolean> {
  try {
    const userRewards = await getUserRewards(userId);
    if (!userRewards || userRewards.totalPoints < points) {
      console.log('[rewardsService] Insufficient points for redemption.');
      return false;
    }
    return addPoints(userId, -points, 'redemption', description, rewardId);
  } catch (error) {
    console.error('Error redeeming points:', error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin summary
// ─────────────────────────────────────────────────────────────────────────────

export async function getRewardsSummary() {
  try {
    const transactionsRef = collection(db, 'rewardTransactions');
    const snapshot       = await getDocs(transactionsRef);

    let totalPointsAwarded = 0;
    let totalTransactions  = 0;
    const typeBreakdown: Record<string, number> = {};

    snapshot.forEach((dc) => {
      const d  = dc.data();
      totalPointsAwarded += d.points;
      totalTransactions++;
      if (d.type in typeBreakdown) {
        typeBreakdown[d.type] += d.points;
      } else {
        typeBreakdown[d.type] = d.points;
      }
    });

    return { totalPointsAwarded, totalTransactions, typeBreakdown };
  } catch (error) {
    console.error('Error getting rewards summary:', error);
    return null;
  }
}
