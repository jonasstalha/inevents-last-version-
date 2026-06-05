import { getAuth } from 'firebase/auth';
import { addDoc, collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import app from './firebaseConfig';

const testOrderCreation = async () => {
  try {
    console.log('🧪 Testing order creation...');

    const auth = getAuth(app);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('❌ No user logged in');
      return;
    }

    console.log('👤 Current user:', currentUser.uid, currentUser.email);

    const db = getFirestore(app);

    // Test data
    const testOrder = {
      clientId: currentUser.uid,
      clientName: currentUser.displayName || 'Test Client',
      artistId: 'test-artist-id', // Use a real artist ID
      gigId: 'test-gig-id',
      gigTitle: 'Test Gig',
      message: 'Test order message',
      items: [{
        id: 'item1',
        title: 'Test Item',
        quantity: 1,
        price: 100
      }],
      totalPrice: 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('📝 Attempting to save order:', testOrder);

    // Save to global orders collection
    const orderRef = await addDoc(collection(db, 'orders'), testOrder);
    console.log('✅ Order saved to global collection with ID:', orderRef.id);

    // Save to artist's incoming orders
    const artistIncomingOrdersRef = collection(db, 'users', testOrder.artistId, 'incoming_orders');
    const incomingOrderData = {
      ...testOrder,
      orderId: orderRef.id
    };

    await addDoc(artistIncomingOrdersRef, incomingOrderData);
    console.log('✅ Order saved to artist incoming orders');

    // Verify the order was saved
    console.log('🔍 Verifying order was saved...');

    // Check global orders
    const globalOrdersQuery = query(collection(db, 'orders'), where('clientId', '==', currentUser.uid));
    const globalOrdersSnapshot = await getDocs(globalOrdersQuery);
    console.log('📊 Global orders found:', globalOrdersSnapshot.size);

    // Check artist's incoming orders
    const artistOrdersQuery = query(collection(db, 'users', testOrder.artistId, 'incoming_orders'));
    const artistOrdersSnapshot = await getDocs(artistOrdersQuery);
    console.log('📊 Artist incoming orders found:', artistOrdersSnapshot.size);

  } catch (error: any) {
    console.error('❌ Error in test:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
};

export default testOrderCreation;