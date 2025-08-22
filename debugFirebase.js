// Debug script to check Firebase collections directly
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

// Firebase config - same as in your app
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.appspot.com',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

// Initialize app
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check users collection
async function checkUsersCollection() {
  console.log('====== CHECKING USERS COLLECTION ======');
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    if (usersSnap.empty) {
      console.log('❌ No users found in Firebase!');
      return;
    }
    
    console.log(`✅ Found ${usersSnap.size} users in Firebase:`);
    usersSnap.forEach(doc => {
      const userData = doc.data();
      console.log(`- User ID: ${doc.id}, Name: ${userData.name || userData.fullName || 'Unknown'}, Role: ${userData.role || 'No role'}`);
      
      // Check if this user has services or tickets
      checkUserServices(doc.id);
      checkUserTickets(doc.id);
    });
  } catch (error) {
    console.error('Error checking users collection:', error);
  }
}

// Check services for a specific user
async function checkUserServices(userId) {
  try {
    const servicesRef = collection(db, 'users', userId, 'services');
    const servicesSnap = await getDocs(servicesRef);
    
    if (servicesSnap.empty) {
      console.log(`  - User ${userId} has no services`);
      return;
    }
    
    console.log(`  - User ${userId} has ${servicesSnap.size} services:`);
    servicesSnap.forEach(doc => {
      const serviceData = doc.data();
      console.log(`    * Service ID: ${doc.id}, Title: ${serviceData.title || 'Untitled'}, Price: ${serviceData.price || 'No price'}`);
    });
  } catch (error) {
    console.error(`Error checking services for user ${userId}:`, error);
  }
}

// Check tickets for a specific user
async function checkUserTickets(userId) {
  try {
    const ticketsRef = collection(db, 'users', userId, 'tickets');
    const ticketsSnap = await getDocs(ticketsRef);
    
    if (ticketsSnap.empty) {
      console.log(`  - User ${userId} has no tickets`);
      return;
    }
    
    console.log(`  - User ${userId} has ${ticketsSnap.size} tickets:`);
    ticketsSnap.forEach(doc => {
      const ticketData = doc.data();
      console.log(`    * Ticket ID: ${doc.id}, Event: ${ticketData.eventName || 'Untitled'}, Price: ${ticketData.price || 'No price'}`);
    });
  } catch (error) {
    console.error(`Error checking tickets for user ${userId}:`, error);
  }
}

// Run the check
checkUsersCollection().then(() => {
  console.log('====== DEBUGGING COMPLETE ======');
});
