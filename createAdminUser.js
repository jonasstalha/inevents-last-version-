// createAdminUser.js
// Usage: node createAdminUser.js

const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key JSON file
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

// TODO: Change these to your desired admin credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createAdmin() {
  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: 'Admin',
      emailVerified: true,
      disabled: false,
    });

    // Set custom claims (optional, for admin role)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

    // Add user to Firestore with admin role
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      uid: userRecord.uid,
      email: ADMIN_EMAIL,
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      lastLogin: new Date(),
      name: 'Admin',
    });

    console.log('✅ Admin user created:', ADMIN_EMAIL);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.error('Admin user already exists.');
    } else {
      console.error('Error creating admin user:', error);
    }
  }
}

createAdmin();
