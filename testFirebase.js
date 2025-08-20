/**
 * Quick Firebase Connection Test
 * Run this in your terminal to test Firebase connection
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.appspot.com',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase Connection...');
    console.log('Project ID:', firebaseConfig.projectId);
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Test reading users collection
    console.log('📖 Testing users collection read...');
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log(`Found ${snapshot.docs.length} documents in users collection`);
    
    if (snapshot.empty) {
      console.log('📝 Users collection is empty, creating test user...');
      
      // Create a test user
      const testUserRef = doc(db, 'users', 'test-user-' + Date.now());
      await setDoc(testUserRef, {
        name: 'Test User',
        email: 'test@inevents.com',
        phone: '+1234567890',
        role: 'client',
        status: 'active',
        signupDate: new Date(),
        lastLogin: new Date(),
        revenue: 0,
        region: 'Test Region'
      });
      
      console.log('✅ Test user created successfully');
      
      // Read again to verify
      const newSnapshot = await getDocs(usersRef);
      console.log(`Now found ${newSnapshot.docs.length} documents in users collection`);
    } else {
      console.log('✅ Users found in collection:');
      snapshot.docs.forEach((doc, index) => {
        console.log(`User ${index + 1}: ${doc.id}`, doc.data());
      });
    }
    
    console.log('🎉 Firebase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Full error:', error);
    
    // Common error solutions
    if (error.code === 'permission-denied') {
      console.log('\n🔧 SOLUTION for permission-denied:');
      console.log('1. Go to Firebase Console > Firestore Database > Rules');
      console.log('2. Update rules to allow read/write:');
      console.log('   allow read, write: if request.auth != null;');
      console.log('3. Or for testing: allow read, write: if true;');
    } else if (error.code === 'unavailable') {
      console.log('\n🔧 SOLUTION for unavailable:');
      console.log('1. Check internet connection');
      console.log('2. Verify Firebase project is active');
      console.log('3. Try again in a few minutes');
    } else {
      console.log('\n🔧 General troubleshooting:');
      console.log('1. Verify Firebase project ID is correct');
      console.log('2. Check API key is valid');
      console.log('3. Ensure Firestore is enabled in your project');
    }
  }
}

// Run the test
testFirebaseConnection();
