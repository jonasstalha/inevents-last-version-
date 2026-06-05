const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc, updateDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.firebasestorage.app',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple version of addPoints function for this script
async function addPoints(userId, points, description) {
  const userRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userRef);
  
  if (userSnapshot.exists()) {
    const currentPoints = userSnapshot.data().points || 0;
    const newPoints = currentPoints + points;
    
    await updateDoc(userRef, {
      points: newPoints,
      updatedAt: new Date()
    });
    
    console.log(`Added ${points} points to user ${userId}. Total: ${newPoints}`);
    return true;
  }
  return false;
}

/**
 * Fix user statistics and award missing points
 */
async function fixUserStatisticsAndPoints(userId) {
  console.log(`🔧 Starting statistics fix for user: ${userId}`);
  console.log('='.repeat(50));
  
  let totalPointsAwarded = 0;
  
  try {
    // 1. Get all user's orders
    console.log('📦 Scanning existing orders...');
    const userOrdersRef = collection(db, 'users', userId, 'orders');
    const userOrdersSnapshot = await getDocs(userOrdersRef);
    const orders = userOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Found ${orders.length} total orders`);
    
    // 2. Get all user's tickets
    console.log('🎫 Scanning existing tickets...');
    const userTicketsRef = collection(db, 'users', userId, 'tickets');
    const userTicketsSnapshot = await getDocs(userTicketsRef);
    const tickets = userTicketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Found ${tickets.length} total tickets`);
    console.log('');

    // 3. Award points for existing orders
    console.log('💰 Awarding points for existing orders...');
    
    for (const order of orders) {
      if (order.status === 'confirmed' || order.status === 'completed' || order.status === 'paid') {
        try {
          const orderAmount = parseFloat(order.totalPrice || order.total || '0') || 0;
          const orderPoints = 50; // Standard order points
          
          await addPoints(userId, orderPoints, `Retroactive points for order ${order.id}`);
          
          console.log(`   ✅ Awarded ${orderPoints} points for order: ${order.ticketName || 'Order'} (${orderAmount} MAD)`);
          totalPointsAwarded += orderPoints;
          
        } catch (error) {
          console.error(`   ❌ Failed to award points for order ${order.id}:`, error.message);
        }
      }
    }

    // 4. Award points for existing tickets
    console.log('🎫 Awarding points for existing tickets...');
    
    for (const ticket of tickets) {
      try {
        const ticketPoints = 25; // Standard ticket points
        
        await addPoints(userId, ticketPoints, `Retroactive points for ticket ${ticket.id}`);
        
        console.log(`   ✅ Awarded ${ticketPoints} points for ticket: ${ticket.eventName || ticket.ticketName || 'Event'}`);
        totalPointsAwarded += ticketPoints;
        
      } catch (error) {
        console.error(`   ❌ Failed to award points for ticket ${ticket.id}:`, error.message);
      }
    }

    // 5. Update user statistics
    console.log('📊 Recalculating user statistics...');
    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      
      await updateDoc(userRef, {
        statistics: {
          totalOrders: orders.length,
          totalTickets: tickets.length,
          totalSpent: orders.reduce((sum, order) => {
            const amount = parseFloat(order.totalPrice || order.total || '0') || 0;
            return sum + amount;
          }, 0),
          lastUpdated: new Date()
        },
        updatedAt: new Date()
      });
      
      console.log('✅ User statistics updated successfully');
    }
    
    console.log('');
    console.log('🎉 Fix completed successfully!');
    console.log(`📈 Total points awarded: ${totalPointsAwarded}`);
    console.log(`📊 Orders processed: ${orders.length}`);
    console.log(`🎫 Tickets processed: ${tickets.length}`);
    
    return {
      success: true,
      pointsAwarded: totalPointsAwarded,
      ordersProcessed: orders.length,
      ticketsProcessed: tickets.length
    };
    
  } catch (error) {
    console.error('❌ Error during statistics fix:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage example
async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.log('❌ Please provide a user ID as an argument');
    console.log('Usage: node fixUserStats.js <user-id>');
    process.exit(1);
  }
  
  const result = await fixUserStatisticsAndPoints(userId);
  
  if (result.success) {
    console.log('✅ Statistics fix completed successfully!');
  } else {
    console.log('❌ Statistics fix failed:', result.error);
    process.exit(1);
  }
}

// Don't auto-run if imported as module
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixUserStatisticsAndPoints };