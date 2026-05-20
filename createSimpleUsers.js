/**
 * Create Simple Default Test Users for inevents Firebase Project
 * Creates client, artist, and admin users for testing
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

async function createSimpleUsers() {
  try {
    console.log('🔥 Creating simple default test users...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    const users = [
      {
        email: 'testclient@example.com',
        password: 'password123',
        name: 'Test Client',
        phone: '+1-555-1001',
        role: 'client',
        status: 'active',
        signupDate: new Date(),
        lastLogin: new Date(),
        revenue: 0,
        region: 'Test Region',
        eventsAttended: 0,
        favoriteCategory: 'Music'
      },
      {
        email: 'testartist@example.com',
        password: 'password123',
        name: 'Test Artist',
        phone: '+1-555-1002',
        role: 'artist',
        status: 'active',
        signupDate: new Date(),
        lastLogin: new Date(),
        revenue: 0,
        region: 'Test Region',
        specialization: 'Music',
        eventsOrganized: 0,
        storeName: 'Test Artist Store',
        city: 'Test City',
        categories: ['Music', 'Performing Arts']
      },
      {
        email: 'testadmin@example.com',
        password: 'password123',
        name: 'Test Admin',
        phone: '+1-555-1003',
        role: 'admin',
        status: 'active',
        signupDate: new Date(),
        lastLogin: new Date(),
        revenue: 0,
        region: 'Test Region',
        isAdmin: true
      }
    ];
    
    console.log(`📝 Creating ${users.length} simple default users...`);
    
    for (const user of users) {
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        const userId = userCredential.user.uid;
        
        // Create user document in Firestore
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          id: userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          signupDate: user.signupDate,
          lastLogin: user.lastLogin,
          revenue: user.revenue,
          region: user.region,
          ...(user.role === 'client' && {
            eventsAttended: user.eventsAttended,
            favoriteCategory: user.favoriteCategory
          }),
          ...(user.role === 'artist' && {
            specialization: user.specialization,
            eventsOrganized: user.eventsOrganized,
            storeName: user.storeName,
            city: user.city,
            categories: user.categories
          }),
          ...(user.role === 'admin' && {
            isAdmin: user.isAdmin
          })
        });
        
        console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️  User ${user.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating ${user.email}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Simple default users creation completed!');
    console.log('\n📋 Test Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Client:');
    console.log('  Email: testclient@example.com');
    console.log('  Password: password123');
    console.log('─────────────────────────────────────');
    console.log('Artist:');
    console.log('  Email: testartist@example.com');
    console.log('  Password: password123');
    console.log('─────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: testadmin@example.com');
    console.log('  Password: password123');
    console.log('─────────────────────────────────────');
    console.log('\nNext steps:');
    console.log('1. Open your app');
    console.log('2. Use the credentials above to test login');
    console.log('3. Each role has different access levels');
    
  } catch (error) {
    console.error('❌ Error creating simple default users:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔧 REMINDER: Update Firestore security rules first!');
      console.log('Go to: https://console.firebase.google.com/project/inevents-2fe56/firestore/rules');
      console.log('Set rule: allow read, write: if true;');
    }
  }
}

createSimpleUsers();
