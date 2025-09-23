/**
 * Create real orders for the currently authenticated user
 * Run this in your app's console or as a React component to test user statistics
 */

import { getAuth } from 'firebase/auth';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import app from './src/firebase/firebaseConfig';

const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Create sample orders for the current user
 */
export const createTestOrdersForCurrentUser = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently authenticated');
    return;
  }

  console.log(`🎯 Creating test orders for user: ${currentUser.email}`);
  
  const orders = [
    {
      clientId: currentUser.uid,
      clientEmail: currentUser.email,
      clientName: currentUser.displayName || 'Test User',
      ticketId: 'wedding-photo-service',
      ticketName: 'Wedding Photography Package',
      artistId: 'photographer-artist-123',
      status: 'confirmed',
      totalPrice: 2500,
      ticketQuantities: [{ type: 'Premium', price: 2500, quantity: 1 }],
      specialRequests: 'Full day coverage with edited photos',
      createdAt: serverTimestamp(),
      totalQuantity: 1,
      orderReference: 'REF-WEDD01-PH'
    },
    {
      clientId: currentUser.uid,
      clientEmail: currentUser.email,
      clientName: currentUser.displayName || 'Test User',
      ticketId: 'birthday-party-service',
      ticketName: 'Birthday Party DJ Service',
      artistId: 'dj-artist-456',
      status: 'completed',
      totalPrice: 800,
      ticketQuantities: [{ type: 'Standard', price: 800, quantity: 1 }],
      specialRequests: 'Mix of 90s and modern music',
      createdAt: serverTimestamp(),
      totalQuantity: 1,
      orderReference: 'REF-BDAY02-DJ'
    },
    {
      clientId: currentUser.uid,
      clientEmail: currentUser.email,
      clientName: currentUser.displayName || 'Test User',
      ticketId: 'concert-tickets',
      ticketName: 'Live Jazz Concert Tickets',
      artistId: 'jazz-band-789',
      status: 'confirmed',
      totalPrice: 300,
      ticketQuantities: [{ type: 'General', price: 150, quantity: 2 }],
      specialRequests: '',
      createdAt: serverTimestamp(),
      totalQuantity: 2,
      orderReference: 'REF-JAZZ03-TK'
    }
  ];

  try {
    let createdCount = 0;
    for (const order of orders) {
      const orderRef = await addDoc(
        collection(db, 'users', currentUser.uid, 'orders'), 
        order
      );
      console.log(`✅ Order ${++createdCount}: ${order.ticketName} (${order.totalPrice} MAD)`);
    }
    
    console.log('🎉 All test orders created successfully!');
    console.log('📊 Expected statistics:');
    console.log('   - Orders: 3');
    console.log('   - Total Spent: 3600 MAD');
    console.log('   - Points from orders: 30 (3 × 10)');
    console.log('   - Points from spending: 360 (3600 ÷ 10)');
    console.log('   - Total Expected Points: 390+');
    console.log('');
    console.log('🔄 Refresh your profile page to see updated statistics!');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating test orders:', error);
    return false;
  }
};

/**
 * Create sample tickets for the current user
 */
export const createTestTicketsForCurrentUser = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently authenticated');
    return;
  }

  console.log(`🎫 Creating test tickets for user: ${currentUser.email}`);
  
  const tickets = [
    {
      userId: currentUser.uid,
      eventName: 'Rock Festival 2024',
      eventDate: new Date('2024-06-15'),
      ticketType: 'VIP Pass',
      price: 200,
      venue: 'Central Park Amphitheater',
      status: 'active',
      purchaseDate: serverTimestamp(),
      qrCode: `QR${Date.now()}1`
    },
    {
      userId: currentUser.uid,
      eventName: 'Comedy Night Special',
      eventDate: new Date('2024-03-22'),
      ticketType: 'Premium Seating',
      price: 80,
      venue: 'Downtown Comedy Club',
      status: 'active',
      purchaseDate: serverTimestamp(),
      qrCode: `QR${Date.now()}2`
    }
  ];

  try {
    let createdCount = 0;
    for (const ticket of tickets) {
      const ticketRef = await addDoc(
        collection(db, 'users', currentUser.uid, 'tickets'), 
        ticket
      );
      console.log(`✅ Ticket ${++createdCount}: ${ticket.eventName} (${ticket.price} MAD)`);
    }
    
    console.log('🎉 All test tickets created successfully!');
    console.log('📊 Expected additional statistics:');
    console.log('   - Tickets: +2');
    console.log('   - Points from tickets: +10 (2 × 5)');
    console.log('');
    console.log('🔄 Refresh your profile page to see updated statistics!');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating test tickets:', error);
    return false;
  }
};

// Usage example:
/*
// In your React component or console:

import { createTestOrdersForCurrentUser, createTestTicketsForCurrentUser } from './createTestOrdersForUser';

// To create test orders
await createTestOrdersForCurrentUser();

// To create test tickets
await createTestTicketsForCurrentUser();
*/