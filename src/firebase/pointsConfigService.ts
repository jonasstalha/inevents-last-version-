/**
 * pointsConfigService.ts
 * ─────────────────────
 * Dynamically loads the point-reward rules from a single Firestore document:
 *
 *   pointsConfig        → `pointsConfig` collection
 *   globalRules         → `role_global` document  (fall-back if doc is missing)
 *   pointsConfigService → this file
 *
 * The document fields mirror the old `REWARDS_CONFIG` shape so every existing
 * call-site (orderService, customOrderService, rewardsService, userStatsService)
 * gets the same live values without any code change.
 */

import { collection, doc, getDoc, getFirestore, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from './firebaseConfig';

const db = getFirestore(app);
const GLOBAL_RULES_DOC  = 'role_global';
const COLLECTION        = 'pointsConfig';

// ─── Shape ────────────────────────────────────────────────────────────────────

export interface PointsConfigResult {
  id:                          string;
  orderPoints:                 number;
  ticketPoints:                number;
  serviceOrderPoints:          number;
  customOrderPoints:           number;
  serviceOrderSpendingPoints:  number;   // cooldown (currently in userStatsService:10 per service order → this controls `userStatsService.ts:137` line)
  ticketSpendingPoints:        number;   // cooldown (currently in userStatsService:5 per ticket  → same)
  spendingRatePerMad:          number;   // currently `userStatsService:138` → `Math.floor(orderAmt/10)`
  reviewPoints:                number;
  referralPoints:              number;
  updatedAt:                   Date;
}

/** Raw Firestore doc shape — used when writing a new rule set. */
export interface WritePointsConfig {
  orderPoints:                number;
  ticketPoints:               number;
  serviceOrderPoints:         number;
  customOrderPoints:          number;
  serviceOrderSpendingPoints: number;
  ticketSpendingPoints:       number;
  spendingRatePerMad:         number;
  reviewPoints:               number;
  referralPoints:             number;
}

/** Fall-back values used when the Firestore doc does not yet exist. */
const DEFAULT_RULES: WritePointsConfig = {
  orderPoints:                50,
  ticketPoints:               25,
  serviceOrderPoints:         75,
  customOrderPoints:          100,
  serviceOrderSpendingPoints: 10,
  ticketSpendingPoints:       5,
  spendingRatePerMad:         10,  // 1 point per 10 MAD
  reviewPoints:               10,
  referralPoints:             200,
};

// ─── Read / Listen ────────────────────────────────────────────────────────────

/**
 * One-shot read of the live point-reward rules from Firestore.
 * Falls back to `DEFAULT_RULES` if the doc is absent.
 */
export async function getPointsConfig(): Promise<PointsConfigResult> {
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    return { id: GLOBAL_RULES_DOC, ...DEFAULT_RULES, updatedAt: new Date() };
  }
  try {
    const ruleRef  = doc(collection(db, COLLECTION), GLOBAL_RULES_DOC);
    const ruleSnap = await getDoc(ruleRef);

    if (ruleSnap.exists()) {
      const d = ruleSnap.data() as any;
      return toResult(ruleSnap.id, d);
    }

    // First-time boot: seed the doc with defaults
    await setDoc(ruleRef, {
      ...DEFAULT_RULES,
      updatedAt: Timestamp.now(),
    });
    return toResult(ruleSnap.id, DEFAULT_RULES);

  } catch (error) {
    console.error('Error reading points config, using defaults:', error);
    return { id: GLOBAL_RULES_DOC, ...DEFAULT_RULES, updatedAt: new Date() };
  }
}

/** Subscribe to config changes in realtime. Unsubscribe via the return value. */
export function subscribePointsConfig(
  onNext: (cfg: PointsConfigResult) => void,
): () => void {
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    onNext({ id: GLOBAL_RULES_DOC, ...DEFAULT_RULES, updatedAt: new Date() });
    return () => {};
  }
  const ruleRef = doc(collection(db, COLLECTION), GLOBAL_RULES_DOC);
  return onSnapshot(
    ruleRef,
    (snap) => {
      if (snap.exists()) {
        onNext(toResult(snap.id, snap.data() as any));
      } else {
        onNext({ id: GLOBAL_RULES_DOC, ...DEFAULT_RULES, updatedAt: new Date() });
      }
    },
    (err) => {
      console.error('Error listening to points config:', err);
    },
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toResult(id: string, d: any): PointsConfigResult {
  return {
    id:                   id,
    orderPoints:          safeNumber(d.orderPoints,              50),
    ticketPoints:         safeNumber(d.ticketPoints,              25),
    serviceOrderPoints:   safeNumber(d.serviceOrderPoints,        75),
    customOrderPoints:    safeNumber(d.customOrderPoints,         100),
    serviceOrderSpendingPoints: safeNumber(d.serviceOrderSpendingPoints, 10),
    ticketSpendingPoints:      safeNumber(d.ticketSpendingPoints,       5),
    spendingRatePerMad:   safeNumber(d.spendingRatePerMad,        10),
    reviewPoints:         safeNumber(d.reviewPoints,               10),
    referralPoints:       safeNumber(d.referralPoints,             200),
    updatedAt:            (d.updatedAt?.toDate?.()) || new Date(),
  };
}

function safeNumber(v: any, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
