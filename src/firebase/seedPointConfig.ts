/**
 * seedPointConfig.ts
 * ────────────────
 * Seeds the Firestore `pointsConfig/role_global` with the current default values.
 * Run from the project root:
 *   npx tsx src/firebase/seedPointConfig.ts
 *
 * After seeding, open your Firebase Console → Firestore → pointsConfig → role_global
 * and edit the values. Changes are picked up live by all running clients.
 */

import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

const COLLECTION = 'pointsConfig';
const RULES_DOC  = 'role_global';

const DEFAULTS = {
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

async function main() {
  try {
    await setDoc(
      doc(db, COLLECTION, RULES_DOC),
      { ...DEFAULTS, updatedAt: Timestamp.now() },
      { merge: true },
    );
    console.log('Done — pointsConfig/role_global seeded with:', DEFAULTS);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();
