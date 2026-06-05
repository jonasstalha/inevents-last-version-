/**
 * Test script to create sample orders in user's subcollection for statistics testing
 * This creates orders in the correct location: users/{userId}/orders
 */

import { getAuth } from 'firebase/auth';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import app from './src/firebase/firebaseConfig';

const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Create sample orders for the current authenticated user
 */
export const createSampleOrdersForUser = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently authenticated');
    return false;
  }

  console.log(`🎯 Creating sample orders for user: ${currentUser.email}`);
  
  const sampleOrders = [
    {
      clientId: currentUser.uid,
      clientEmail: currentUser.email,
      clientName: currentUser.displayName || 'Test User',
      ticketId: 'wedding-photography-001',
      ticketName: 'Wedding Photography Session',
      artistId: 'photographer-123',
      status: 'confirmed',
      totalPrice: 2500,
      ticketQuantities: [{ type: 'Premium Package', price: 2500, quantity: 1 }],
      specialRequests: 'Need full day coverage',
      createdAt: serverTimestamp(),
      totalQuantity: 1,
      orderReference: 'REF-WEDD01'
    },
    {
      clientId: currentUser.uid,
      clientEmail: currentUser.email,
      clientName: currentUser.displayName || 'Test User',
      ticketId: 'birthday-dj-002',
      ticketName: 'Birthday Party DJ Service',
      artistId: 'dj-456',
      status: 'completed',
      totalPrice: 800,
      ticketQuantities: [{ type: 'Standard', price: 800, quantity: 1 }],
      specialRequests: 'Mix of 90s and modern music',
      createdAt: serverTimestamp(),
      totalQuantity: 1,
      orderReference: 'REF-BDAY02'
    },
    {
      clientId: currentUser.uid,
      clientEmail: currentUser.email,
      clientName: currentUser.displayName || 'Test User',
      ticketId: 'concert-tickets-003',
      ticketName: 'Jazz Concert VIP Tickets',
      artistId: 'jazz-band-789',
      status: 'confirmed',
      totalPrice: 600,
      ticketQuantities: [{ type: 'VIP', price: 300, quantity: 2 }],
      specialRequests: 'Front row seats preferred',
      createdAt: serverTimestamp(),
      totalQuantity: 2,
      orderReference: 'REF-JAZZ03'
    },
    {
      clientId: currentUser.uid,
      clientEmail: currentUser.email,
      clientName: currentUser.displayName || 'Test User',
      ticketId: 'catering-service-004',
      ticketName: 'Event Catering Service',
      artistId: 'caterer-101',
      status: 'pending', // This won't count towards stats
      totalPrice: 1200,
      ticketQuantities: [{ type: 'Deluxe Menu', price: 1200, quantity: 1 }],
      specialRequests: 'Vegetarian options needed',
      createdAt: serverTimestamp(),
      totalQuantity: 1,
      orderReference: 'REF-CATER04'
    }
  ];

  try {
    let successCount = 0;
    for (const order of sampleOrders) {
      // Add to user's orders subcollection
      const orderRef = await addDoc(
        collection(db, 'users', currentUser.uid, 'orders'), 
        order
      );
      console.log(`✅ Created order: ${order.ticketName} (${order.totalPrice} MAD) - Status: ${order.status}`);
      successCount++;
    }
    
    console.log(`🎉 Successfully created ${successCount} sample orders!`);
    console.log('📊 Expected Statistics:');
    console.log('   - Confirmed/Completed Orders: 3 (pending orders don\'t count)');
    console.log('   - Total Spent: 3900 MAD (2500 + 800 + 600)');
    console.log('   - Points: Will be calculated by rewards system');
    console.log('');
    console.log('🔄 Go to your profile page to see the updated statistics!');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating sample orders:', error);
    return false;
  }
};

/**
 * Create sample tickets for the current user
 */
export const createSampleTicketsForUser = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently authenticated');
    return false;
  }

  console.log(`🎫 Creating sample tickets for user: ${currentUser.email}`);
  
  const sampleTickets = [
    {
      userId: currentUser.uid,
      eventName: 'Summer Music Festival 2024',
      eventDate: new Date('2024-07-15'),
      ticketType: 'General Admission',
      price: 150,
      venue: 'Central Park Amphitheater',
      status: 'active',
      purchaseDate: serverTimestamp(),
      qrCode: `TICKET-${Date.now()}-1`
    },
    {
      userId: currentUser.uid,
      eventName: 'Art Gallery Opening Night',
      eventDate: new Date('2024-05-20'),
      ticketType: 'VIP Access',
      price: 200,
      venue: 'Modern Art Gallery',
      status: 'active',
      purchaseDate: serverTimestamp(),
      qrCode: `TICKET-${Date.now()}-2`
    }
  ];

  try {
    let successCount = 0;
    for (const ticket of sampleTickets) {
      // Add to user's tickets subcollection
      const ticketRef = await addDoc(
        collection(db, 'users', currentUser.uid, 'tickets'), 
        ticket
      );
      console.log(`✅ Created ticket: ${ticket.eventName} (${ticket.price} MAD)`);
      successCount++;
    }
    
    console.log(`🎉 Successfully created ${successCount} sample tickets!`);
    console.log('📊 Expected Additional Statistics:');
    console.log('   - Tickets: +2');
    console.log('   - Additional Points: Will be calculated by rewards system');
    console.log('');
    console.log('🔄 Refresh your profile page to see updated statistics!');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating sample tickets:', error);
    return false;
  }
};

// Usage in console or React component:
/*
import { createSampleOrdersForUser, createSampleTicketsForUser } from './createSampleData';

// Create sample orders and tickets
await createSampleOrdersForUser();
await createSampleTicketsForUser();
*/