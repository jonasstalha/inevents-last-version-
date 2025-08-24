import { getAuth } from 'firebase/auth';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    increment,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import app from './firebaseConfig';

/**
 * Order Service
 * 
 * This service handles order-related operations including:
 * - Creating new ticket orders
 * - Fetching orders for clients
 * - Managing order status updates
 * - Reducing ticket quantities when purchases are made
 * 
 * When a ticket is purchased, the following inventory updates occur:
 * 1. In the artist's ticket collection: 
 *    - Updates specific ticket type quantities if they exist
 *    - Otherwise decrements the overall availableQuantity
 * 2. In the global tickets collection:
 *    - Decrements the availableTickets counter
 */

// Interface for order creation
export interface OrderInput {
  ticketId: string;
  artistId: string;
  totalPrice: number;
  ticketName?: string;
  clientName?: string;
  ticketQuantities: {
    type: string;
    price: number;
    quantity: number;
  }[];
  specialRequests?: string;
}

// Interface for order statuses
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/**
 * Generates a unique order reference code
 * @returns String with format REF-XXXXX-XX
 */
const generateOrderReference = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'REF-';
  
  // Add first 5 characters
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  result += '-';
  
  // Add last 2 characters
  for (let i = 0; i < 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Send order confirmation notification
 * This is a placeholder for email sending functionality
 * In a production app, this would connect to a cloud function or email service
 * 
 * @param orderData Order data to include in notification
 * @param orderId ID of the order
 */
const sendOrderConfirmationNotification = async (orderData: any, orderId: string): Promise<void> => {
  // This is a placeholder function for demonstration
  console.log(`Order confirmation notification would be sent for order ${orderId}`);
  console.log(`Order details: ${JSON.stringify(orderData)}`);

  // In a real application, this function would:
  // 1. Connect to Firebase Cloud Functions or a third-party email service
  // 2. Format a nice HTML email with order details
  // 3. Send the email to the customer
  // 4. Also potentially send an SMS confirmation
  
  // Example with Firebase Cloud Functions (pseudo-code):
  /*
  const sendEmail = firebase.functions().httpsCallable('sendOrderConfirmationEmail');
  await sendEmail({
    to: orderData.clientEmail,
    orderId: orderId,
    orderReference: orderData.orderReference,
    ticketName: orderData.ticketName,
    totalPrice: orderData.totalPrice,
    ticketQuantities: orderData.ticketQuantities
  });
  */
  
  // For now, we just return as if the email was sent
  return Promise.resolve();
};

/**
 * Create a new ticket order
 * @param orderData Order information
 * @returns Promise with order ID
 */
export const createOrder = async (orderData: OrderInput): Promise<string> => {
  try {
    const db = getFirestore(app);
    const auth = getAuth(app);

    if (!auth.currentUser) {
      throw new Error('User is not authenticated');
    }

    const clientId = auth.currentUser.uid;
    const clientEmail = auth.currentUser.email || '';
    const clientName = auth.currentUser.displayName || orderData.clientName || 'Anonymous Customer';

    // Create the order with required fields
    const orderToSubmit = {
      clientId,
      clientEmail,
      clientName,
      ticketId: orderData.ticketId,
      ticketName: orderData.ticketName || 'Event Ticket',
      artistId: orderData.artistId,
      status: 'pending' as OrderStatus,
      totalPrice: orderData.totalPrice,
      ticketQuantities: orderData.ticketQuantities,
      specialRequests: orderData.specialRequests || '',
      createdAt: serverTimestamp(),
      totalQuantity: orderData.ticketQuantities.reduce((acc, item) => acc + item.quantity, 0),
      orderReference: generateOrderReference()
    };

    // Add the order to the client's orders collection
    const clientOrdersRef = collection(db, 'users', clientId, 'orders');
    const orderDoc = await addDoc(clientOrdersRef, orderToSubmit);

    // Also add a copy to the artist's incoming orders
    const artistOrdersRef = collection(db, 'users', orderData.artistId, 'incoming_orders');
    await addDoc(artistOrdersRef, {
      ...orderToSubmit,
      orderId: orderDoc.id,
    });
    
    // Decrease available ticket quantity
    try {
      const ticketRef = doc(db, 'users', orderData.artistId, 'tickets', orderData.ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (ticketDoc.exists()) {
        const ticketData = ticketDoc.data();
        const ticketTypes = ticketData.ticketTypes || [];
        
        // Check if we need to update specific ticket types
        if (ticketTypes.length > 0) {
          // Create updated ticket types with reduced quantities
          const updatedTicketTypes = [...ticketTypes];
          
          // Update quantities for each ordered ticket type
          orderData.ticketQuantities.forEach(orderedType => {
            const matchingTypeIndex = updatedTicketTypes.findIndex(
              (type: any) => type.type === orderedType.type
            );
            
            if (matchingTypeIndex !== -1) {
              // Convert string quantity to number, subtract ordered amount, then convert back
              const currentQty = parseInt(updatedTicketTypes[matchingTypeIndex].quantity || '0', 10);
              const newQty = Math.max(0, currentQty - orderedType.quantity);
              updatedTicketTypes[matchingTypeIndex].quantity = String(newQty);
            }
          });
          
          // Update the ticket document with new quantities
          await updateDoc(ticketRef, {
            ticketTypes: updatedTicketTypes
          });
        } else {
          // If no ticket types specified, just decrement the overall ticket quantity
          await updateDoc(ticketRef, {
            availableQuantity: increment(-orderToSubmit.totalQuantity)
          });
        }
      }
    } catch (error) {
      console.warn('Failed to update ticket availability in artist collection:', error);
      // Don't throw this error as it's not critical to order creation
    }
    
    // Also update ticket in global tickets collection
    try {
      const globalTicketRef = doc(db, 'tickets', orderData.ticketId);
      const globalTicketDoc = await getDoc(globalTicketRef);
      
      if (globalTicketDoc.exists()) {
        const totalQuantityOrdered = orderData.ticketQuantities.reduce(
          (sum, item) => sum + item.quantity, 0
        );
        
        // Update available tickets count if it exists
        if (globalTicketDoc.data().availableTickets !== undefined) {
          await updateDoc(globalTicketRef, {
            availableTickets: increment(-totalQuantityOrdered)
          });
        }
      }
    } catch (error) {
      console.warn('Failed to update ticket availability in global collection:', error);
      // Don't throw this error as it's not critical to order creation
    }
    
    // Send notification/email would go here in production
    // This is a placeholder that would be replaced with actual email sending
    if (process.env.NODE_ENV === 'production') {
      try {
        await sendOrderConfirmationNotification(orderToSubmit, orderDoc.id);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't throw this error as it's not critical to order creation
      }
    }

    return orderDoc.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Get orders for the current client
 * @returns Promise with array of orders
 */
export const getClientOrders = async () => {
  try {
    const db = getFirestore(app);
    const auth = getAuth(app);

    if (!auth.currentUser) {
      throw new Error('User is not authenticated');
    }

    const clientId = auth.currentUser.uid;
    const ordersRef = collection(db, 'users', clientId, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);

    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching client orders:', error);
    throw error;
  }
};

/**
 * Get a specific order by ID
 * @param orderId The order ID to retrieve
 * @returns The order data or null if not found
 */
export const getOrderById = async (orderId: string) => {
  try {
    const db = getFirestore(app);
    const auth = getAuth(app);

    if (!auth.currentUser) {
      throw new Error('User is not authenticated');
    }

    const clientId = auth.currentUser.uid;
    const orderRef = doc(db, 'users', clientId, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (orderDoc.exists()) {
      return {
        id: orderDoc.id,
        ...orderDoc.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

/**
 * Update order status
 * @param orderId Order ID to update
 * @param status New order status
 */
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  try {
    const db = getFirestore(app);
    const auth = getAuth(app);

    if (!auth.currentUser) {
      throw new Error('User is not authenticated');
    }

    const clientId = auth.currentUser.uid;
    const orderRef = doc(db, 'users', clientId, 'orders', orderId);
    
    // Get the order first to check if it exists
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }
    
    // Get artist ID to update in their collection too
    const orderData = orderDoc.data();
    const artistId = orderData.artistId;
    
    // Update client's order
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    // Find and update the corresponding order in the artist's collection
    const artistOrdersRef = collection(db, 'users', artistId, 'incoming_orders');
    const q = query(artistOrdersRef, where('orderId', '==', orderId));
    const artistOrdersSnapshot = await getDocs(q);
    
    if (!artistOrdersSnapshot.empty) {
      const artistOrderDoc = artistOrdersSnapshot.docs[0];
      await updateDoc(doc(db, 'users', artistId, 'incoming_orders', artistOrderDoc.id), {
        status,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Cancel an order
 * @param orderId Order ID to cancel
 */
export const cancelOrder = async (orderId: string): Promise<void> => {
  try {
    // Reuse the updateOrderStatus function with 'cancelled' status
    await updateOrderStatus(orderId, 'cancelled');
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};
