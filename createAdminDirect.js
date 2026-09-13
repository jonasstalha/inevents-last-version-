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
  const adminEmail = 'admin@inevent.ma';
  const adminPassword = 'inevent2026';

  try {
    console.log('Creating admin user for direct admin access...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const userId = userCredential.user.uid;

    await setDoc(doc(db, 'users', userId), {
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
      isAdmin: true,
    });

    console.log(`Admin user created: ${adminEmail}`);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.error(`Admin user already exists: ${adminEmail}. Reset its password in Firebase Console if needed.`);
    } else {
      console.error('Error creating admin user:', error.message);
    }
  }
}

createAdminDirect();
