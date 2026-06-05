import { getAuth } from 'firebase/auth';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import app from './firebaseConfig';

const testOrderSave = async () => {
  try {
    console.log('🧪 Testing order save...');

    const auth = getAuth(app);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('❌ No user logged in');
      return;
    }

    console.log('👤 Current user:', currentUser.uid);

    const db = getFirestore(app);

    // Test order data
    const testOrder = {
      clientId: currentUser.uid,
      clientName: 'Test Client',
      artistId: '5AkkqtBG1dQF0NpaX581QWK2x433', // Use the artist's ID from the logs
      gigId: 'test-gig',
      gigTitle: 'Test Gig',
      message: 'Test message',
      items: [{ id: '1', title: 'Test Item', quantity: 1, price: 100 }],
      totalPrice: 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('📝 Test order:', testOrder);

    // Test 1: Save to global orders
    console.log('🔄 Testing global orders collection...');
    try {
      const globalOrderRef = await addDoc(collection(db, 'orders'), testOrder);
      console.log('✅ Global order saved with ID:', globalOrderRef.id);
    } catch (error) {
      console.error('❌ Failed to save to global orders:', error);
    }

    // Test 2: Save to artist's incoming orders
    console.log('🔄 Testing artist incoming orders...');
    try {
      const artistIncomingRef = collection(db, 'users', testOrder.artistId, 'incoming_orders');
      const incomingOrderData = { ...testOrder, orderId: 'test-order-id' };
      const artistOrderRef = await addDoc(artistIncomingRef, incomingOrderData);
      console.log('✅ Artist incoming order saved with ID:', artistOrderRef.id);
    } catch (error) {
      console.error('❌ Failed to save to artist incoming orders:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

export default testOrderSave;