/**
 * Create Admin User for Direct Admin Access
 * This creates an admin user that will be redirected directly to admin page
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.firebasestorage.app',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

async function createAdminDirect() {
  try {
    console.log('🔥 Creating admin user for direct admin access...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    const adminEmail = 'admin@inevents.com';
    const adminPassword = 'admin123456';
    
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const userId = userCredential.user.uid;
      
      // Create admin user document in Firestore
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        id: userId,
        name: 'Admin User',
        email: adminEmail,
        phone: '+1-555-0000',
        role: 'admin',
        status: 'active',
        signupDate: new Date(),
        lastLogin: new Date(),
        revenue: 0,
        region: 'Admin Region',
        isAdmin: true
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('\n📋 Admin Credentials:');
      console.log('─────────────────────────────────────');
      console.log('Email: admin@inevents.com');
      console.log('Password: admin123456');
      console.log('─────────────────────────────────────');
      console.log('\nThis admin user will be redirected directly to the admin page.');
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  Admin user already exists');
        console.log('\n📋 Admin Credentials:');
        console.log('─────────────────────────────────────');
        console.log('Email: admin@inevents.com');
        console.log('Password: admin123456');
        console.log('─────────────────────────────────────');
      } else {
        console.error('❌ Error creating admin user:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminDirect();
