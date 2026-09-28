const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyA4d4sIGVIDfhMOuG75qDK_rUZiPsugcYE',
  authDomain: 'inevents-2fe56.firebaseapp.com',
  projectId: 'inevents-2fe56',
  storageBucket: 'inevents-2fe56.firebasestorage.app',
  messagingSenderId: '780609459655',
  appId: '1:780609459655:android:c4535e1323f166ef7f75e2',
};

async function createTestTickets() {
  try {
    console.log('🎫 Creating test tickets with real data...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Sample artist user ID (use one of the existing user IDs)
    const artistId = 'yZxgYn4vZSh1lsnJhqetn1o4iwO2'; // Known user from previous check
    
    // Sample tickets data with web-accessible images
    const sampleTickets = [
      {
        name: 'Electronic Music Festival 2025',
        eventName: 'Electronic Music Festival 2025',
        description: 'Join us for the biggest electronic music festival of the year featuring top DJs from around the world.',
        price: 250,
        location: 'Casablanca, Morocco',
        category: 'musique',
        flyer: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
        ticketTypes: [
          { type: 'General Admission', price: 250 },
          { type: 'VIP', price: 450 },
          { type: 'VVIP', price: 750 }
        ],
        eventDate: new Date('2025-07-15T20:00:00'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        artistId,
        artistName: 'Festival Organizers',
        artistPhoto: 'https://images.unsplash.com/photo-1494790108755-2616c667c-tZM?w=150&h=150&fit=crop&crop=face',
        status: 'active',
        visibility: 'public',
        rating: 4.8,
        availableTickets: 500,
        soldTickets: 50
      },
      {
        name: 'Jazz Night at Blue Note',
        eventName: 'Jazz Night at Blue Note',
        description: 'An intimate evening of smooth jazz with local and international artists.',
        price: 120,
        location: 'Rabat, Jazz Club Blue Note',
        category: 'musique',
        flyer: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
        ticketTypes: [
          { type: 'Standard', price: 120 },
          { type: 'Premium Table', price: 200 }
        ],
        eventDate: new Date('2025-06-20T21:00:00'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        artistId,
        artistName: 'Blue Note Collective',
        artistPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        status: 'active',
        visibility: 'public',
        rating: 4.6,
        availableTickets: 80,
        soldTickets: 20
      },
      {
        name: 'Comedy Night Special',
        eventName: 'Comedy Night Special',
        description: 'Laugh out loud with the best comedians in Morocco for a night of non-stop entertainment.',
        price: 80,
        location: 'Marrakech, Comedy Club Central',
        category: 'comedie',
        flyer: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
        ticketTypes: [
          { type: 'Regular Seating', price: 80 },
          { type: 'Front Row', price: 120 }
        ],
        eventDate: new Date('2025-06-10T19:30:00'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        artistId,
        artistName: 'Comedy Club Central',
        artistPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        status: 'active',
        visibility: 'public',
        rating: 4.9,
        availableTickets: 150,
        soldTickets: 30
      },
      {
        name: 'Art Exhibition Opening',
        eventName: 'Art Exhibition Opening',
        description: 'Contemporary Moroccan art exhibition opening with wine and networking.',
        price: 50,
        location: 'Casablanca, Modern Art Gallery',
        category: 'formation',
        flyer: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        ticketTypes: [
          { type: 'General Entry', price: 50 },
          { type: 'Artist Meet & Greet', price: 100 }
        ],
        eventDate: new Date('2025-06-05T18:00:00'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        artistId,
        artistName: 'Modern Art Gallery',
        artistPhoto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
        status: 'active',
        visibility: 'public',
        rating: 4.3,
        availableTickets: 100,
        soldTickets: 15
      }
    ];
    
    // Add tickets to Firebase
    const ticketsRef = collection(db, 'users', artistId, 'tickets');
    
    for (const ticket of sampleTickets) {
      const docRef = await addDoc(ticketsRef, ticket);
      console.log(`✅ Created ticket: ${ticket.name} (ID: ${docRef.id})`);
    }
    
    console.log(`🎉 Successfully created ${sampleTickets.length} test tickets!`);
    
  } catch (error) {
    console.error('❌ Error creating test tickets:', error);
  }
}

createTestTickets();
