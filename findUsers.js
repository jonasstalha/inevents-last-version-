const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function findUsersWithOrders() {
  console.log('🔍 Looking for users with orders and tickets...');
  
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`Found ${usersSnapshot.docs.length} total users`);
    console.log('');
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Check if user has orders
      const ordersRef = collection(db, 'users', userId, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      
      // Check if user has tickets
      const ticketsRef = collection(db, 'users', userId, 'tickets');
      const ticketsSnapshot = await getDocs(ticketsRef);
      
      const orderCount = ordersSnapshot.docs.length;
      const ticketCount = ticketsSnapshot.docs.length;
      const currentPoints = userData.points || 0;
      
      if (orderCount > 0 || ticketCount > 0) {
        console.log(`👤 User: ${userData.firstName || 'Unknown'} ${userData.lastName || ''}`);
        console.log(`   📧 Email: ${userData.email || 'No email'}`);
        console.log(`   🆔 ID: ${userId}`);
        console.log(`   📦 Orders: ${orderCount}`);
        console.log(`   🎫 Tickets: ${ticketCount}`);
        console.log(`   💰 Current Points: ${currentPoints}`);
        console.log('   ---');
        
        if (orderCount > 0) {
          ordersSnapshot.docs.forEach(orderDoc => {
            const order = orderDoc.data();
            console.log(`      📦 Order: ${order.ticketName || 'Unknown'} - ${order.status} - ${order.totalPrice || 0} MAD`);
          });
        }
        
        if (ticketCount > 0) {
          ticketsSnapshot.docs.forEach(ticketDoc => {
            const ticket = ticketDoc.data();
            console.log(`      🎫 Ticket: ${ticket.eventName || ticket.ticketName || 'Unknown'} - ${ticket.status}`);
          });
        }
        
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error finding users:', error);
  }
}

findUsersWithOrders().catch(console.error);