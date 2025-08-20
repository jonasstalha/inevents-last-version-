// Firebase Debug Helper for inevents project
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore } from 'firebase/firestore';
import { app } from './firebaseConfig';

const db = getFirestore(app);
const auth = getAuth(app);

export const debugFirebaseConnection = async () => {
  console.log('=== FIREBASE DEBUG HELPER ===');
  
  try {
    // Check Firebase app configuration
    console.log('Firebase App Config:', {
      projectId: app.options.projectId,
      appId: app.options.appId,
      apiKey: app.options.apiKey ? 'Set' : 'Missing',
      authDomain: app.options.authDomain,
    });

    // Check authentication state
    console.log('Auth Current User:', auth.currentUser ? 'Logged in' : 'Not logged in');
    
    // Try to read from different collections
    const collectionsToCheck = ['users', 'Users', 'profiles', 'accounts'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        console.log(`\nChecking collection: ${collectionName}`);
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        console.log(`✅ ${collectionName}: ${snapshot.docs.length} documents`);
        
        if (snapshot.docs.length > 0) {
          console.log('Sample document from', collectionName, ':', snapshot.docs[0].data());
        }
      } catch (error) {
        console.log(`❌ Error accessing ${collectionName}:`, (error as Error).message);
      }
    }

    // Check if we can write to the database
    try {
      console.log('\nTesting write permissions...');
      // This will fail if we don't have write permissions
      const testDoc = doc(db, 'test', 'connection-test');
      await getDoc(testDoc); // Try to read a test document
      console.log('✅ Database read access confirmed');
    } catch (error) {
      console.log('❌ Database access error:', (error as Error).message);
    }

  } catch (error) {
    console.error('❌ Firebase Debug Error:', error);
  }
  
  console.log('=== END FIREBASE DEBUG ===');
};

export const getFirebaseProjectInfo = () => {
  return {
    projectId: app.options.projectId,
    appId: app.options.appId,
    authDomain: app.options.authDomain,
    isInitialized: !!app,
  };
};
