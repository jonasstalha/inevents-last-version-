/**
 * Check if Firestore database exists and is properly configured
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, enableNetwork, disableNetwork } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.appspot.com',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

async function checkFirestoreSetup() {
  try {
    console.log('🔥 Checking Firestore setup for inevents-2fe56...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase app initialized');
    console.log('✅ Firestore instance created');
    
    // Try to enable network (this will fail if Firestore isn't set up)
    await enableNetwork(db);
    console.log('✅ Network connection enabled');
    
    console.log('\n📋 Next steps:');
    console.log('1. Go to: https://console.firebase.google.com/project/inevents-2fe56/firestore');
    console.log('2. If you see "Get started", click it to create the database');
    console.log('3. Choose "Start in test mode" for now');
    console.log('4. Select a location (usually us-central1)');
    console.log('5. Then update the security rules as mentioned earlier');
    
  } catch (error) {
    console.error('❌ Firestore setup check failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.message.includes('not-found') || error.message.includes('database')) {
      console.log('\n🔧 SOLUTION: Create Firestore Database');
      console.log('1. Go to: https://console.firebase.google.com/project/inevents-2fe56/firestore');
      console.log('2. Click "Create database"');
      console.log('3. Choose "Start in test mode"');
      console.log('4. Select your preferred location');
      console.log('5. Wait for creation to complete');
    } else if (error.code === 'permission-denied') {
      console.log('\n🔧 SOLUTION: Update Security Rules');
      console.log('1. Go to: https://console.firebase.google.com/project/inevents-2fe56/firestore/rules');
      console.log('2. Set rules to: allow read, write: if true;');
      console.log('3. Click Publish');
    }
  }
}

checkFirestoreSetup();
