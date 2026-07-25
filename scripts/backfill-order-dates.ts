import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { firebaseConfigObject } from '../src/firebase/firebaseConfig';

// One-off script to replace unresolved serverTimestamp sentinels in orders
// Usage: set NODE_ENV=production (if needed) then run with ts-node or compile to JS

async function backfill() {
  const app = initializeApp(firebaseConfigObject);
  const db = getFirestore(app);

  console.log('Connecting to Firestore project:', firebaseConfigObject.projectId);

  const snap = await getDocs(collection(db, 'orders'));
  let fixed = 0;
  for (const d of snap.docs) {
    const data = d.data() as any;
    const dateVal = data.date ?? data.timestamp ?? data.createdAt;
    if (dateVal && dateVal._methodName === 'serverTimestamp') {
      // Use updatedAt if it's already a Timestamp, otherwise fallback to now
      const fallback = data.updatedAt?.toDate?.() ?? new Date();
      await updateDoc(doc(db, 'orders', d.id), { date: Timestamp.fromDate(fallback) });
      console.log(`Fixed ${d.id} -> ${fallback.toISOString()}`);
      fixed++;
    }
  }

  console.log(`Done. Fixed ${fixed} orders.`);
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
