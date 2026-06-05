/**
 * Test script to create sample orders and tickets for user statistics testing
 * This script creates real Firebase data to test the user statistics functionality
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc,
  serverTimestamp 
} = require('firebase/firestore');

// Firebase config (same as your app)
const firebaseConfig = {
  apiKey: "AIzaSyBOh6yIGynB7jrKC3tl_Wl_HBcXKg5Wt8o",
  authDomain: "inevents-5eb44.firebaseapp.com",
  projectId: "inevents-5eb44",
  storageBucket: "inevents-5eb44.firebasestorage.app",
  messagingSenderId: "1059799686527",
  appId: "1:1059799686527:web:b4aa0e3a6e3b16df9ebdc3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test user ID (replace with actual user ID from your app)
const TEST_USER_ID = 'test-user-123';

/**
 * Create sample orders for a user
 */
async function createSampleOrders() {
  console.log('🎯 Creating sample orders...');
  
  const orders = [
    {
      clientId: TEST_USER_ID,
      clientEmail: 'test@example.com',
      clientName: 'Test User',
      ticketId: 'ticket-1',
      ticketName: 'Wedding Photography Session',
      artistId: 'artist-123',
      status: 'confirmed',
      totalPrice: 1500,
      ticketQuantities: [{ type: 'Standard', price: 1500, quantity: 1 }],
      specialRequests: '',
      createdAt: serverTimestamp(),
      totalQuantity: 1,
      orderReference: 'REF-TEST01-AA'
    },
    {
      clientId: TEST_USER_ID,
      clientEmail: 'test@example.com',
      clientName: 'Test User',
      ticketId: 'ticket-2',
      ticketName: 'Birthday Party Entertainment',
      artistId: 'artist-456',
      status: 'completed',
      totalPrice: 800,
      ticketQuantities: [{ type: 'Basic', price: 800, quantity: 1 }],
      specialRequests: 'Need setup by 3 PM',
      createdAt: serverTimestamp(),
      totalQuantity: 1,
      orderReference: 'REF-TEST02-BB'
    },
    {
      clientId: TEST_USER_ID,
      clientEmail: 'test@example.com',
      clientName: 'Test User',
      ticketId: 'ticket-3',
      ticketName: 'Concert VIP Tickets',
      artistId: 'artist-789',
      status: 'confirmed',
      totalPrice: 600,
      ticketQuantities: [{ type: 'VIP', price: 300, quantity: 2 }],
      specialRequests: 'Front row seats preferred',
      createdAt: serverTimestamp(),
      totalQuantity: 2,
      orderReference: 'REF-TEST03-CC'
    }
  ];

  try {
    for (const order of orders) {
      // Add to user's orders subcollection
      const orderRef = await addDoc(
        collection(db, 'users', TEST_USER_ID, 'orders'), 
        order
      );
      console.log(`✅ Created order: ${orderRef.id} - ${order.ticketName}`);
    }
  } catch (error) {
    console.error('❌ Error creating orders:', error);
  }
}

/**
 * Create sample tickets for a user
 */
async function createSampleTickets() {
  console.log('🎫 Creating sample tickets...');
  
  const tickets = [
    {
      userId: TEST_USER_ID,
      eventName: 'Jazz Night at Blue Note',
      eventDate: new Date('2024-01-15'),
      ticketType: 'General Admission',
      price: 50,
      venue: 'Blue Note Jazz Club',
      status: 'active',
      purchaseDate: serverTimestamp(),
      qrCode: 'QR123456789'
    },
    {
      userId: TEST_USER_ID,
      eventName: 'Art Gallery Opening',
      eventDate: new Date('2024-01-20'),
      ticketType: 'VIP Access',
      price: 75,
      venue: 'Modern Art Gallery',
      status: 'active',
      purchaseDate: serverTimestamp(),
      qrCode: 'QR987654321'
    }
  ];

  try {
    for (const ticket of tickets) {
      // Add to user's tickets subcollection
      const ticketRef = await addDoc(
        collection(db, 'users', TEST_USER_ID, 'tickets'), 
        ticket
      );
      console.log(`✅ Created ticket: ${ticketRef.id} - ${ticket.eventName}`);
    }
  } catch (error) {
    console.error('❌ Error creating tickets:', error);
  }
}

/**
 * Create user statistics document
 */
async function createUserStatistics() {
  console.log('📊 Creating user statistics...');
  
  const stats = {
    userId: TEST_USER_ID,
    orders: 3,
    tickets: 2,
    points: 125, // 30 (3 orders × 10) + 29 (2900 MAD ÷ 10) + 10 (2 tickets × 5) + 56 (from previous activities)
    totalSpent: 2900, // 1500 + 800 + 600
    lastUpdated: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'userStatistics', TEST_USER_ID), stats);
    console.log('✅ Created user statistics');
  } catch (error) {
    console.error('❌ Error creating user statistics:', error);
  }
}

/**
 * Main function to run all test data creation
 */
async function main() {
  console.log('🚀 Starting test data creation...');
  console.log(`📋 Test User ID: ${TEST_USER_ID}`);
  console.log('');
  
  await createSampleOrders();
  console.log('');
  await createSampleTickets();
  console.log('');
  await createUserStatistics();
  
  console.log('');
  console.log('🎉 Test data creation completed!');
  console.log('');
  console.log('📱 To test in your app:');
  console.log(`1. Make sure you're logged in as user: ${TEST_USER_ID}`);
  console.log('2. Navigate to the Profile screen');
  console.log('3. You should see:');
  console.log('   - Orders: 3');
  console.log('   - Tickets: 2');
  console.log('   - Points: 125');
  console.log('');
  console.log('💡 Note: Replace TEST_USER_ID with your actual authenticated user ID for real testing');
}

// Run the script
main().catch(console.error);