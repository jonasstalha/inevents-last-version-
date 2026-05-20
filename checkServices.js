/**
 * Helper script to check services data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.firebasestorage.app',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

async function checkServices() {
  try {
    console.log('🛎️ Checking Services in Firebase...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Find all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`Found ${usersSnapshot.docs.length} users`);
    
    let serviceCount = 0;
    
    // Loop through users to find services
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const servicesRef = collection(db, 'users', userId, 'services');
      const servicesSnapshot = await getDocs(servicesRef);
      
      if (!servicesSnapshot.empty) {
        console.log(`\n📍 User ${userId} has ${servicesSnapshot.size} services`);
        
        servicesSnapshot.forEach(serviceDoc => {
          serviceCount++;
          const serviceData = serviceDoc.data();
          console.log(`\n🧩 Service ID: ${serviceDoc.id}`);
          console.log('Title:', serviceData.title);
          console.log('Price:', serviceData.price);
          
          // Check for image field
          if (serviceData.image) {
            console.log('Single image:', serviceData.image);
          } else {
            console.log('❌ No single image found');
          }
          
          // Check for images array
          if (serviceData.images && Array.isArray(serviceData.images) && serviceData.images.length > 0) {
            console.log('Images array:', serviceData.images);
          } else {
            console.log('❌ No images array found');
          }
        });
      }
    }
    
    console.log(`\n🔍 Total services found: ${serviceCount}`);
    
    if (serviceCount === 0) {
      console.log('No services found in any user collection');
    }
    
  } catch (error) {
    console.error('Error checking services:', error);
  }
}

checkServices();
