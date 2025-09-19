/**
 * Create Test Users for inevents Firebase Project
 * Run this after fixing the Firestore security rules
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.appspot.com',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

async function createTestUsers() {
  try {
    console.log('🔥 Creating test users for inevents project...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const testUsers = [
      {
        id: 'event-organizer-1',
        name: 'Sarah Johnson',
        email: 'sarah.organizer@inevents.com',
        phone: '+1-555-0101',
        role: 'artist',
        status: 'active',
        signupDate: new Date('2024-01-15'),
        lastLogin: new Date(),
        revenue: 5250,
        region: 'North America',
        specialization: 'Corporate Events',
        eventsOrganized: 23
      },
      {
        id: 'event-attendee-1',
        name: 'Michael Chen',
        email: 'michael.attendee@inevents.com',
        phone: '+1-555-0102',
        role: 'client',
        status: 'active',
        signupDate: new Date('2024-02-20'),
        lastLogin: new Date('2024-07-30'),
        revenue: 0,
        region: 'Asia',
        eventsAttended: 12,
        favoriteCategory: 'Tech Conferences'
      },
      {
        id: 'event-manager-1',
        name: 'Emma Rodriguez',
        email: 'emma.manager@inevents.com',
        phone: '+1-555-0103',
        role: 'artist',
        status: 'active',
        signupDate: new Date('2024-03-10'),
        lastLogin: new Date('2024-07-29'),
        revenue: 3420,
        region: 'Europe',
        specialization: 'Wedding Planning',
        eventsOrganized: 15
      },
      {
        id: 'event-vendor-1',
        name: 'David Kim',
        email: 'david.vendor@inevents.com',
        phone: '+1-555-0104',
        role: 'artist',
        status: 'active',
        signupDate: new Date('2024-04-05'),
        lastLogin: new Date('2024-07-28'),
        revenue: 2800,
        region: 'North America',
        specialization: 'Audio/Visual Services',
        eventsSupported: 34
      },
      {
        id: 'event-client-1',
        name: 'Lisa Thompson',
        email: 'lisa.client@inevents.com',
        phone: '+1-555-0105',
        role: 'client',
        status: 'active',
        signupDate: new Date('2024-05-12'),
        lastLogin: new Date(),
        revenue: 0,
        region: 'Australia',
        eventsAttended: 8,
        favoriteCategory: 'Music Festivals'
      }
    ];
    
    console.log(`📝 Creating ${testUsers.length} test users...`);
    
    for (const user of testUsers) {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }
    
    console.log('🎉 All test users created successfully!');
    console.log('\nNext steps:');
    console.log('1. Open your admin panel in the app');
    console.log('2. Click "Refresh Users" to load these users');
    console.log('3. Test the bulk notification features');
    
  } catch (error) {
    console.error('❌ Error creating test users:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔧 REMINDER: Update Firestore security rules first!');
      console.log('Go to: https://console.firebase.google.com/project/inevents-2fe56/firestore/rules');
      console.log('Set rule: allow read, write: if true;');
    }
  }
}

createTestUsers();
