/**
 * Quick Firebase Ticket Data Check
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.firebasestorage.app',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

async function checkTickets() {
  try {
    console.log('🎫 Checking Tickets in Firebase...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Find all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`Found ${usersSnapshot.docs.length} users`);
    
    let ticketCount = 0;
    
    // Loop through users to find tickets
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const ticketsRef = collection(db, 'users', userId, 'tickets');
      const ticketsQuery = query(ticketsRef, orderBy('createdAt', 'desc'), limit(5));
      const ticketsSnapshot = await getDocs(ticketsQuery);
      
      if (!ticketsSnapshot.empty) {
        console.log(`\n📍 User ${userId} has ${ticketsSnapshot.size} tickets`);
        
        ticketsSnapshot.forEach(ticketDoc => {
          ticketCount++;
          const ticketData = ticketDoc.data();
          console.log(`\n🎟️ Ticket ID: ${ticketDoc.id}`);
          console.log('Title:', ticketData.title || ticketData.eventName);
          console.log('Price:', ticketData.price);
          
          // Check for flyer field
          if (ticketData.flyer) {
            console.log('Flyer image:', ticketData.flyer);
          } else {
            console.log('❌ No flyer image found');
          }
          
          // Check for images array
          if (ticketData.images && Array.isArray(ticketData.images) && ticketData.images.length > 0) {
            console.log('Images array:', ticketData.images);
          } else {
            console.log('❌ No images array found');
          }
        });
      }
    }
    
    console.log(`\n🔍 Total tickets found: ${ticketCount}`);
    
    if (ticketCount === 0) {
      console.log('No tickets found in any user collection');
    }
    
  } catch (error) {
    console.error('Error checking tickets:', error);
  }
}

checkTickets();
