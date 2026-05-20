/**
 * Debug script to check user statistics and find existing orders/tickets
 * Run this to see what data exists for the current user
 */

import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import app from './src/firebase/firebaseConfig';

const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Debug user statistics - check all possible data locations
 */
export const debugUserStatistics = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently authenticated');
    return;
  }

  const userId = currentUser.uid;
  console.log(`🔍 Debugging statistics for user: ${currentUser.email} (${userId})`);
  console.log('');

  try {
    // 1. Check user's orders subcollection
    console.log('📦 Checking user orders in users/{userId}/orders...');
    const userOrdersRef = collection(db, 'users', userId, 'orders');
    const userOrdersSnapshot = await getDocs(userOrdersRef);
    
    console.log(`Found ${userOrdersSnapshot.docs.length} orders in user subcollection:`);
    userOrdersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. Order ${doc.id}:`);
      console.log(`     - Status: ${data.status}`);
      console.log(`     - Total: ${data.totalPrice || data.total} MAD`);
      console.log(`     - Ticket: ${data.ticketName}`);
      console.log(`     - Date: ${data.createdAt?.toDate?.() || 'Unknown'}`);
    });
    console.log('');

    // 2. Check user's tickets subcollection
    console.log('🎫 Checking user tickets in users/{userId}/tickets...');
    const userTicketsRef = collection(db, 'users', userId, 'tickets');
    const userTicketsSnapshot = await getDocs(userTicketsRef);
    
    console.log(`Found ${userTicketsSnapshot.docs.length} tickets in user subcollection:`);
    userTicketsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. Ticket ${doc.id}:`);
      console.log(`     - Event: ${data.eventName || data.ticketName}`);
      console.log(`     - Price: ${data.price} MAD`);
      console.log(`     - Status: ${data.status}`);
    });
    console.log('');

    // 3. Check global orders collection (if exists)
    console.log('🌐 Checking global orders collection...');
    try {
      const globalOrdersQuery = query(
        collection(db, 'orders'),
        where('clientId', '==', userId)
      );
      const globalOrdersSnapshot = await getDocs(globalOrdersQuery);
      console.log(`Found ${globalOrdersSnapshot.docs.length} orders in global collection:`);
      
      globalOrdersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. Order ${doc.id}:`);
        console.log(`     - Status: ${data.status}`);
        console.log(`     - Total: ${data.totalPrice || data.total} MAD`);
      });
    } catch (error) {
      console.log('   ⚠️  Global orders collection does not exist or is inaccessible');
    }
    console.log('');

    // 4. Check global userTickets collection (if exists)
    console.log('🎫 Checking global userTickets collection...');
    try {
      const globalTicketsQuery = query(
        collection(db, 'userTickets'),
        where('userId', '==', userId)
      );
      const globalTicketsSnapshot = await getDocs(globalTicketsQuery);
      console.log(`Found ${globalTicketsSnapshot.docs.length} tickets in global userTickets collection:`);
      
      globalTicketsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. Ticket ${doc.id}:`);
        console.log(`     - Event: ${data.eventName}`);
        console.log(`     - Price: ${data.price} MAD`);
      });
    } catch (error) {
      console.log('   ⚠️  Global userTickets collection does not exist or is inaccessible');
    }
    console.log('');

    // 5. Check if there are orders in other possible locations
    console.log('🔍 Checking for orders in other possible collections...');
    
    // Check orders where client email matches
    if (currentUser.email) {
      try {
        const emailOrdersQuery = query(
          collection(db, 'orders'),
          where('clientEmail', '==', currentUser.email)
        );
        const emailOrdersSnapshot = await getDocs(emailOrdersQuery);
        console.log(`Found ${emailOrdersSnapshot.docs.length} orders by email in global orders collection`);
      } catch (error) {
        console.log('   ⚠️  Could not check orders by email');
      }
    }

    // 6. Calculate what statistics should be
    const allUserOrders = userOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const confirmedOrders = allUserOrders.filter((order: any) => 
      order.status === 'confirmed' || order.status === 'completed'
    );
    
    const totalSpent = confirmedOrders.reduce((sum: number, order: any) => {
      const amount = typeof order.totalPrice === 'number' ? order.totalPrice :
                     typeof order.total === 'number' ? order.total : 
                     parseFloat(order.totalPrice || order.total || '0') || 0;
      return sum + amount;
    }, 0);

    const allUserTickets = userTicketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('📊 Expected Statistics:');
    console.log(`   - Total Orders: ${allUserOrders.length}`);
    console.log(`   - Confirmed Orders: ${confirmedOrders.length}`);
    console.log(`   - Total Tickets: ${allUserTickets.length}`);
    console.log(`   - Total Spent: ${totalSpent} MAD`);
    console.log(`   - Expected Points: ${(confirmedOrders.length * 10) + (allUserTickets.length * 5) + Math.floor(totalSpent / 10)}`);
    console.log('');

    console.log('✅ Debug completed! Check the console output above for your data.');
    
    return {
      userOrders: allUserOrders,
      confirmedOrders,
      userTickets: allUserTickets,
      totalSpent,
      expectedStats: {
        orders: confirmedOrders.length,
        tickets: allUserTickets.length,
        totalSpent,
        points: (confirmedOrders.length * 10) + (allUserTickets.length * 5) + Math.floor(totalSpent / 10)
      }
    };

  } catch (error) {
    console.error('❌ Error debugging user statistics:', error);
  }
};

// Usage instructions:
console.log('🚀 To debug your user statistics, run this in your app:');
console.log('');
console.log('import { debugUserStatistics } from "./debugUserStats";');
console.log('');
console.log('// In your component or console:');
console.log('debugUserStatistics().then(result => {');
console.log('  console.log("Debug Result:", result);');
console.log('});');