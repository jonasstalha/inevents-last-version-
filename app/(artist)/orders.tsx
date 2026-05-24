import { Theme } from '@/src/constants/theme';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getFirestore, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { Calendar, Check, Clock, MapPin, Users, X, FileText, Download } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { generateInvoice, saveInvoiceToStorage, OrderForInvoice, ArtistForInvoice } from '@/src/utils/invoiceUtils';
import { sendOrderUpdateNotification } from '@/src/firebase/orderService';
import { toTimestampString } from '@/src/utils/timestampUtils';

type Order = {
  id: string;
  clientId: string;
  artistId: string;
  gigId?: string;
  gigTitle?: string;
  message?: string;
  items?: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  extras?: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'declined' | 'confirmed' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt?: string;
  invoiceUrl?: string;
  clientName?: string;
  clientImage?: string;
  ticketName?: string;
  ticketQuantities?: Array<{
    type: string;
    price: number;
    quantity: number;
  }>;
  specialRequests?: string;
  clientInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  orderReference?: string;
  totalQuantity?: number;
  // Custom service order fields
  type?: 'ticket' | 'service';
  serviceId?: string;
  serviceName?: string;
  clientPrice?: number;
  realPrice?: number;
  customization?: {
    eventDate: string;
    eventTime: string;
    duration: string;
    location: string;
    guestCount: string;
    specificRequests: string;
  };
  priceProposal?: {
    proposedPrice: string;
    budgetRange: string;
    priceJustification: string;
  };
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    additionalNotes: string;
  };
};

export default function ArtistOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'confirmed' | 'declined' | 'rejected' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [newOrderNotification, setNewOrderNotification] = useState<Order | null>(null);
  const router = useRouter();
  const db = getFirestore();
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          console.error('No user logged in');
          setLoading(false);
          return;
        }
        
        // Set up real-time listener for ticket orders — server-side filter
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, where('artistId', '==', currentUser.uid));
        
        // Set up real-time listener for custom service orders — server-side filter
        const customOrdersRef = collection(db, 'customOrders');
        const customOrdersQuery = query(customOrdersRef, where('artistId', '==', currentUser.uid));
        
        console.log('Setting up onSnapshot listeners for orders...');
        
        const unsubscribeOrders = onSnapshot(ordersQuery, async (querySnapshot) => {
          await processOrdersSnapshot(querySnapshot, 'ticket');
        }, (error) => {
          console.error('Error listening to ticket orders:', error);
        });
        
        const unsubscribeCustomOrders = onSnapshot(customOrdersQuery, async (querySnapshot) => {
          await processOrdersSnapshot(querySnapshot, 'service');
        }, (error) => {
          console.error('Error listening to custom orders:', error);
        });
        
        const processOrdersSnapshot = async (querySnapshot: any, orderType: 'ticket' | 'service') => {
          if (!isMounted) return;
          
          console.log(`=== ${orderType.toUpperCase()} ORDERS SNAPSHOT ===`);
          console.log('Docs received:', querySnapshot.size);
          
          try {
            // Check for new orders (for notification)
            const previousOrderIds = orders.map(o => o.id);
            const newOrders: Order[] = [...orders]; // Start with existing orders
            
            for (const docSnapshot of querySnapshot.docs) {
              const orderData = docSnapshot.data();
              let clientName = orderData.clientName || orderData.personalInfo?.fullName || 'Client';
              let clientImage = orderData.clientImage || 'https://ui-avatars.com/api/?name=Client';
              
              console.log(`📦 Processing ${orderType} order:`, {
                id: docSnapshot.id,
                artistId: orderData.artistId,
                clientId: orderData.clientId,
                clientName: orderData.clientName || orderData.personalInfo?.fullName,
                hasClientInfo: !!orderData.clientInfo || !!orderData.personalInfo,
                title: orderData.gigTitle || orderData.ticketName || orderData.serviceName,
                status: orderData.status,
                type: orderType
              });
              
              // Check if this is a new order
              if (!previousOrderIds.includes(docSnapshot.id) && orderData.status === 'pending') {
                // Try to fetch client info for notification
                if (orderData.clientId) {
                  try {
                    const clientDoc = await getDoc(doc(db, 'users', orderData.clientId));
                    if (clientDoc.exists()) {
                      const clientData = clientDoc.data();
                      clientName = clientData.name || clientData.displayName || clientName;
                      clientImage = clientData.profilePicture || clientData.profileImage || clientImage;
                    }
                  } catch (clientError) {
                    console.error('Error fetching client details:', clientError);
                  }
                }
                
                // Show notification for new order
                setNewOrderNotification({
                  id: docSnapshot.id,
                  ...(orderData as Omit<Order, 'id'>),
                  clientName,
                  clientImage,
                  type: orderType
                });
                
                // Auto-hide notification after 5 seconds
                setTimeout(() => {
                  setNewOrderNotification(null);
                }, 5000);
              }
              
              // Fetch client info for each order
              if (orderData.clientId) {
                try {
                  const clientDoc = await getDoc(doc(db, 'users', orderData.clientId));
                  if (clientDoc.exists()) {
                    const clientData = clientDoc.data();
                    clientName = clientData.name || clientData.displayName || clientName;
                    clientImage = clientData.profilePicture || clientData.profileImage || clientImage;
                  }
                } catch (clientError) {
                  console.error('Error fetching client details:', clientError);
                }
              }
              
              // Create order object with type
              const orderObj: Order = {
                id: docSnapshot.id,
                ...(orderData as Omit<Order, 'id'>),
                clientName,
                clientImage,
                type: orderType,
                createdAt: toTimestampString(orderData.createdAt) || new Date().toISOString(),
                updatedAt: toTimestampString(orderData.updatedAt),
              };
              
              // Update or add to newOrders array
              const existingIndex = newOrders.findIndex(o => o.id === docSnapshot.id);
              if (existingIndex >= 0) {
                newOrders[existingIndex] = orderObj;
              } else {
                newOrders.push(orderObj);
              }
            }
            
            // Sort by creation date (newest first)
            newOrders.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            console.log('=== ORDER DEBUG ===');
            console.log('Current artist UID:', currentUser.uid);
            console.log('Total orders:', newOrders.length);
            newOrders.forEach(o => console.log('Order artistId:', o.artistId, 'type:', o.type, 'title:', o.gigTitle || o.ticketName || o.serviceName));
            console.log('===================');
            
            // Filter to show only orders for this artist
            const filteredByArtist = newOrders.filter(order => order.artistId === currentUser.uid);
            console.log('My orders count:', filteredByArtist.length);
            
            setOrders(filteredByArtist);
            setFilteredOrders(filteredByArtist);
            setLoading(false);
          } catch (snapshotError) {
            console.error('Snapshot error:', snapshotError);
            setLoading(false);
          }
        };
        
        return () => {
          isMounted = false;
          unsubscribeOrders();
          unsubscribeCustomOrders();
        };
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  // Apply filter whenever orders or activeFilter changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      // Handle different status mappings for service orders
      const statusFilter = activeFilter === 'accepted' ? ['accepted', 'confirmed'] : 
                          activeFilter === 'declined' ? ['declined', 'rejected'] : 
                          [activeFilter];
      setFilteredOrders(orders.filter(order => statusFilter.includes(order.status)));
    }
  }, [orders, activeFilter]);
  
  const handleAcceptOrder = async (order: Order) => {
    try {
      console.log('Accepting order:', order.id, 'type:', order.type);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You need to be logged in to accept orders.');
        return;
      }
      
      const collectionName = order.type === 'service' ? 'customOrders' : 'orders';
      const orderRef = doc(db, collectionName, order.id);
      
      // Get the order to verify the artist ID
      const orderSnapshot = await getDoc(orderRef);
      
      if (!orderSnapshot.exists()) {
        Alert.alert('Error', 'This order no longer exists.');
        return;
      }
      
      const orderData = orderSnapshot.data();
      console.log('Order data from Firestore:', JSON.stringify(orderData, null, 2));
      
      // Verify this artist is the one associated with the order
      if (orderData.artistId !== currentUser.uid) {
        console.log('Permission issue - Artist IDs do not match:');
        console.log('Order artistId:', orderData.artistId);
        console.log('Current user ID:', currentUser.uid);
        Alert.alert('Error', 'You do not have permission to update this order.');
        return;
      }
      
      console.log('Attempting to update order status to accepted');
      // Update the order status in Firestore
      const newStatus = order.type === 'service' ? 'confirmed' : 'accepted';
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Notify the client about the status change
      try {
        await sendOrderUpdateNotification(
          order.clientId,
          currentUser.uid,
          order.id,
          order.type || 'service',
          newStatus,
          `${order.type === 'service' ? 'Service' : 'Ticket'} Order Accepted`,
          `Your order for "${order.gigTitle || order.ticketName || order.serviceName || 'event'}" has been accepted by the artist.`,
        );
      } catch (notifErr) {
        console.warn('Could not send order notification:', notifErr);
      }

      // Update local state
      setOrders(orders.map(o => 
        o.id === order.id ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
      ));
      
      Alert.alert('Order Accepted', `You have accepted this ${order.type} order.`);
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'There was a problem accepting this order. Please try again.');
    }
  };
  
  const handleDeclineOrder = async (order: Order) => {
    try {
      // Confirm with dialog
      Alert.alert(
        'Decline Order',
        'Are you sure you want to decline this order?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes, Decline',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('Declining order:', order.id, 'type:', order.type);
                const auth = getAuth();
                const currentUser = auth.currentUser;
                
                if (!currentUser) {
                  Alert.alert('Error', 'You need to be logged in to decline orders.');
                  return;
                }
                
                const collectionName = order.type === 'service' ? 'customOrders' : 'orders';
                const orderRef = doc(db, collectionName, order.id);
                const orderSnapshot = await getDoc(orderRef);
                
                if (!orderSnapshot.exists()) {
                  Alert.alert('Error', 'This order no longer exists.');
                  return;
                }
                
                const orderData = orderSnapshot.data();
                console.log('Order data from Firestore:', JSON.stringify(orderData, null, 2));
                
                // Verify this artist is the one associated with the order
                if (orderData.artistId !== currentUser.uid) {
                  console.log('Permission issue - Artist IDs do not match:');
                  console.log('Order artistId:', orderData.artistId);
                  console.log('Current user ID:', currentUser.uid);
                  Alert.alert('Error', 'You do not have permission to update this order.');
                  return;
                }
                
                console.log('Attempting to update order status to declined');
                
                // Update the order status in Firestore
                const newStatus = order.type === 'service' ? 'rejected' : 'declined';
                await updateDoc(orderRef, {
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                });
                
                // Notify the client about the status change
                try {
                  await sendOrderUpdateNotification(
                    order.clientId,
                    currentUser.uid,
                    order.id,
                    order.type || 'service',
                    newStatus,
                    `${order.type === 'service' ? 'Service' : 'Ticket'} Order Declined`,
                    `Your order for "${order.gigTitle || order.ticketName || order.serviceName || 'event'}" has been declined by the artist.`,
                  );
                } catch (notifErr) {
                  console.warn('Could not send order notification:', notifErr);
                }
                
                // Update local state
                setOrders(orders.map(o => 
                  o.id === order.id ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
                ));
                
                Alert.alert('Order Declined', `You have declined this ${order.type} order.`);
              } catch (error) {
                console.error('Error declining order:', error);
                Alert.alert('Error', 'There was a problem declining this order. Please try again.');
              }
            } 
          }
        ]
      );
    } catch (error) {
      console.error('Error declining order:', error);
      Alert.alert('Error', 'There was a problem declining this order. Please try again.');
    }
  };
  
   const handleCompleteOrder = async (order: Order) => {
     try {
       console.log('Completing order:', order.id, 'type:', order.type);
       
       // Prevent completing already completed orders
       if (order.status === 'completed') {
         Alert.alert('Already Completed', 'This order has already been completed.');
         return;
       }
       
       const auth = getAuth();
       const currentUser = auth.currentUser;
       
       if (!currentUser) {
         Alert.alert('Error', 'You need to be logged in to complete orders.');
         return;
       }
       
       const collectionName = order.type === 'service' ? 'customOrders' : 'orders';
       const orderRef = doc(db, collectionName, order.id);
       
       // Get the order to verify
       const orderSnapshot = await getDoc(orderRef);
       if (!orderSnapshot.exists()) {
         Alert.alert('Error', 'This order no longer exists.');
         return;
       }
       
       const orderData = orderSnapshot.data();
       if (orderData.artistId !== currentUser.uid) {
         Alert.alert('Error', 'You do not have permission to complete this order.');
         return;
       }
       
       // Update order status to completed
        const newStatus = 'completed';
        await updateDoc(orderRef, {
          status: newStatus,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      
       // Notify the client about the completion
        try {
          await sendOrderUpdateNotification(
            order.clientId,
            currentUser.uid,
            order.id,
            order.type || 'service',
            newStatus,
            `${order.type === 'service' ? 'Service' : 'Ticket'} Order Completed`,
            `Your order for "${order.gigTitle || order.ticketName || order.serviceName || 'event'}" has been completed! You can now download the invoice.`,
          );
        } catch (notifErr) {
          console.warn('Could not send completion notification:', notifErr);
        }
      
      // Generate and save invoice
       try {
         // Check if invoice already exists
         const existingInvoiceDoc = await getDoc(doc(db, 'invoices', order.id));
         if (existingInvoiceDoc.exists()) {
           console.log('✅ Invoice already exists for this order');
           Alert.alert('Invoice Exists', 'An invoice was already generated for this order.');
         } else {
           const artistData = await getDoc(doc(db, 'users', currentUser.uid));
           const artistInfo = artistData.exists() ? artistData.data() : {};
           
         const orderForInvoice: OrderForInvoice = {
           id: order.id,
           clientId: order.clientId,
           artistId: order.artistId,
           gigTitle: order.gigTitle,
           ticketName: order.ticketName,
           serviceName: order.serviceName,
           totalPrice: order.totalPrice,
           status: newStatus,
           createdAt: order.createdAt,
           clientInfo: order.clientInfo,
           personalInfo: order.personalInfo,
           items: order.items,
           ticketQuantities: order.ticketQuantities,
           customization: order.customization,
           artistName: artistInfo.name || artistInfo.storeName || 'Service Provider',
           type: order.type || (order.gigTitle || order.serviceName ? 'service' : 'ticket'),
         };
           
           const artistForInvoice: ArtistForInvoice = {
             name: artistInfo.name || artistInfo.storeName || 'Service Provider',
             email: (artistInfo as any).email,
             phone: (artistInfo as any).phone || (artistInfo as any).phoneNumber,
             address: (artistInfo as any).address || (artistInfo as any).street,
             city: (artistInfo as any).city,
             country: (artistInfo as any).country,
             businessName: (artistInfo as any).storeName || (artistInfo as any).businessName,
             taxId: (artistInfo as any).taxId,
           };
           
           await saveInvoiceToStorage(orderForInvoice, artistForInvoice, order.clientId);
           console.log('✅ Invoice generated and saved');
         }
       } catch (invoiceError) {
         console.warn('⚠️ Failed to generate invoice:', invoiceError);
         // Order is still completed, just invoice failed
       }
      
       // Update local state
       setOrders(orders.map(o => 
         o.id === order.id ? { ...o, status: 'completed', updatedAt: new Date().toISOString() } : o
       ));
       
       Alert.alert('Order Completed', 'The order has been marked as completed and invoice has been generated.');
     } catch (error) {
       console.error('Error completing order:', error);
       Alert.alert('Error', 'There was a problem completing this order. Please try again.');
     }
   };

    const openInvoice = async (url?: string) => {
      if (!url) {
        Alert.alert('Error', 'Invoice URL not available.');
        return;
      }
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open this link.');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to open invoice.');
      }
    };

    const renderOrderItem = ({ item }: { item: Order }) => {
      // Format date to be more readable
      const orderDate = new Date(item.createdAt);
      const formattedDate = `${orderDate.toLocaleDateString()} at ${orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      
      // Use ticketQuantities if items are not available
      const orderItems = item.items || item.ticketQuantities || [];
      
      // Determine what to show for items
      const hasDetailedItems = item.ticketQuantities && item.ticketQuantities.length > 0;
      
      // Get client info (prefer personalInfo for service orders, fallback to clientInfo)
      const clientInfo = item.personalInfo || item.clientInfo;
      
      // Debug log
      console.log('📊 Rendering order:', {
        id: item.id,
        type: item.type,
        title: item.gigTitle || item.ticketName || item.serviceName,
        clientName: clientInfo?.fullName || item.clientName,
        clientEmail: clientInfo?.email,
        hasClientInfo: !!clientInfo,
        fullOrder: item
      });
    
    return (
      <View>
        <TouchableOpacity 
          style={styles.orderCard}
          onPress={() => {
            console.log('🖱️ Order card pressed:', item.id, item.type);
            try {
              router.push({
                pathname: '/(artist)/order-details',
                params: { orderId: item.id, orderType: item.type }
              });
              console.log('✅ Navigation successful');
            } catch (error) {
              console.error('❌ Navigation failed:', error);
              Alert.alert('Error', 'Failed to navigate to order details');
            }
          }}
          activeOpacity={0.7}
        >
        {/* Header with title, type, and status */}
        <View style={styles.orderHeader}>
          <View style={{flex: 1}}>
            <View style={styles.titleRow}>
              <Text style={styles.orderType}>
                {item.type === 'service' ? '🛍️ Service' : '🎫 Ticket'}
              </Text>
              <Text style={styles.orderTitle}>
                {item.gigTitle || item.ticketName || item.serviceName || 'Event Order'}
              </Text>
            </View>
            {item.orderReference && (
              <Text style={styles.orderReference}>REF: {item.orderReference}</Text>
            )}
          </View>
          <View style={[
            styles.statusBadge, 
            item.status === 'pending' ? styles.statusPending : 
            item.status === 'accepted' || item.status === 'confirmed' ? styles.statusAccepted : 
            item.status === 'declined' || item.status === 'rejected' ? styles.statusDeclined : styles.statusCompleted
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'pending' ? 'Pending' : 
               item.status === 'accepted' || item.status === 'confirmed' ? 'Accepted' : 
               item.status === 'declined' || item.status === 'rejected' ? 'Declined' :
               item.status === 'completed' ? 'Completed' : item.status}
            </Text>
          </View>
        </View>
        
        {/* Order Status Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>📋 Order Timeline</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <Text style={styles.timelineDotText}>📝</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Order Created</Text>
              <Text style={styles.timelineDate}>{formattedDate}</Text>
              <Text style={styles.timelineStatus}>Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
            </View>
          </View>
          {item.updatedAt && item.updatedAt !== item.createdAt && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot}>
                <Text style={styles.timelineDotText}>🔄</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Last Updated</Text>
                <Text style={styles.timelineDate}>
                  {new Date(item.updatedAt).toLocaleDateString()} at {new Date(item.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>📊 Order Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Order Type</Text>
              <Text style={styles.summaryValue}>
                {item.type === 'service' ? 'Custom Service' : 'Event Tickets'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={[styles.summaryValue, {color: Theme.colors.primary, fontWeight: 'bold'}]}>
                {item.totalPrice} MAD
              </Text>
            </View>
            {item.type === 'service' && item.clientPrice && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Client Proposed</Text>
                <Text style={styles.summaryValue}>{item.clientPrice} MAD</Text>
              </View>
            )}
            {item.type === 'service' && item.realPrice && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Your Price</Text>
                <Text style={styles.summaryValue}>{item.realPrice} MAD</Text>
              </View>
            )}
            {item.totalQuantity && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Quantity</Text>
                <Text style={styles.summaryValue}>{item.totalQuantity} item(s)</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Client details - compact grid */}
        <View style={styles.clientQuickInfo}>
          <View style={styles.clientQuickRow}>
            <Text style={styles.clientQuickLabel}>
              👤 {clientInfo?.fullName || item.clientName || 'Unknown Client'}
            </Text>
          </View>
          <View style={styles.clientDetailsRow}>
            {clientInfo?.email && clientInfo.email.trim() ? (
              <View style={styles.smallInfoBox}>
                <Text style={styles.smallLabel}>📧 Email</Text>
                <Text style={styles.smallValue} numberOfLines={1}>{clientInfo.email}</Text>
              </View>
            ) : (
              <View style={styles.smallInfoBox}>
                <Text style={styles.smallLabel}>📧 Email</Text>
                <Text style={[styles.smallValue, {color: '#999'}]}>Not provided</Text>
              </View>
            )}
            {clientInfo?.phone && clientInfo.phone.trim() ? (
              <View style={styles.smallInfoBox}>
                <Text style={styles.smallLabel}>📱 Phone</Text>
                <Text style={styles.smallValue}>{clientInfo.phone}</Text>
              </View>
            ) : (
              <View style={styles.smallInfoBox}>
                <Text style={styles.smallLabel}>📱 Phone</Text>
                <Text style={[styles.smallValue, {color: '#999'}]}>Not provided</Text>
              </View>
            )}
          </View>
          
          {clientInfo?.address && clientInfo.address.trim() ? (
            <View style={styles.addressRow}>
              <Text style={styles.smallLabel}>📍 Address</Text>
              <Text style={styles.smallValue} numberOfLines={1}>{clientInfo.address}</Text>
            </View>
          ) : null}
          
          {(clientInfo?.city || clientInfo?.country) && 
           (clientInfo.city?.trim() || clientInfo.country?.trim()) ? (
            <View style={styles.locationRow}>
              <Text style={styles.smallLabel}>🌍 Location</Text>
              <Text style={styles.smallValue}>
                {[clientInfo?.city, clientInfo?.country].filter(c => c?.trim()).join(', ')}
              </Text>
            </View>
          ) : null}
        </View>
        
        {/* Service Order Details - Only show for service orders */}
        {item.type === 'service' && (
          <View style={styles.serviceDetailsContainer}>
            {/* Service Requirements & Specifications */}
            {item.customization && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>🎯 Service Requirements</Text>
                <View style={styles.requirementsGrid}>
                  {item.customization.eventDate && (
                    <View style={styles.requirementItem}>
                      <Calendar size={16} color={Theme.colors.primary} />
                      <View style={styles.requirementContent}>
                        <Text style={styles.requirementLabel}>Event Date</Text>
                        <Text style={styles.requirementValue}>{item.customization.eventDate}</Text>
                      </View>
                    </View>
                  )}
                  {item.customization.eventTime && (
                    <View style={styles.requirementItem}>
                      <Clock size={16} color={Theme.colors.primary} />
                      <View style={styles.requirementContent}>
                        <Text style={styles.requirementLabel}>Event Time</Text>
                        <Text style={styles.requirementValue}>{item.customization.eventTime}</Text>
                      </View>
                    </View>
                  )}
                  {item.customization.duration && (
                    <View style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>Duration</Text>
                      <Text style={styles.requirementValue}>{item.customization.duration}</Text>
                    </View>
                  )}
                  {item.customization.location && (
                    <View style={styles.requirementItem}>
                      <MapPin size={16} color={Theme.colors.primary} />
                      <View style={styles.requirementContent}>
                        <Text style={styles.requirementLabel}>Venue Location</Text>
                        <Text style={styles.requirementValue}>{item.customization.location}</Text>
                      </View>
                    </View>
                  )}
                  {item.customization.guestCount && (
                    <View style={styles.requirementItem}>
                      <Users size={16} color={Theme.colors.primary} />
                      <View style={styles.requirementContent}>
                        <Text style={styles.requirementLabel}>Expected Guests</Text>
                        <Text style={styles.requirementValue}>{item.customization.guestCount} people</Text>
                      </View>
                    </View>
                  )}
                </View>
                
                {item.customization.specificRequests && (
                  <View style={styles.specificRequestsSection}>
                    <Text style={styles.requestsLabel}>🎨 Specific Requirements & Requests:</Text>
                    <Text style={styles.requestsText}>{item.customization.specificRequests}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Financial Details */}
            {item.priceProposal && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>💰 Financial Details</Text>
                <View style={styles.financialGrid}>
                  <View style={styles.financialItem}>
                    <Text style={styles.financialLabel}>Client's Proposed Price</Text>
                    <Text style={styles.financialValue}>{item.priceProposal.proposedPrice} MAD</Text>
                  </View>
                  {item.priceProposal.budgetRange && (
                    <View style={styles.financialItem}>
                      <Text style={styles.financialLabel}>Budget Range</Text>
                      <Text style={styles.financialValue}>{item.priceProposal.budgetRange}</Text>
                    </View>
                  )}
                  {item.realPrice && (
                    <View style={styles.financialItem}>
                      <Text style={styles.financialLabel}>Your Listed Price</Text>
                      <Text style={styles.financialValue}>{item.realPrice} MAD</Text>
                    </View>
                  )}
                  {item.priceProposal.priceJustification && (
                    <View style={styles.financialItemFull}>
                      <Text style={styles.financialLabel}>Price Justification</Text>
                      <Text style={styles.financialValueText}>{item.priceProposal.priceJustification}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Delivery & Logistics */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>🚚 Delivery & Logistics</Text>
              <View style={styles.logisticsGrid}>
                <View style={styles.logisticsItem}>
                  <Text style={styles.logisticsLabel}>Service Delivery</Text>
                  <Text style={styles.logisticsValue}>To be arranged</Text>
                </View>
                <View style={styles.logisticsItem}>
                  <Text style={styles.logisticsLabel}>Communication</Text>
                  <Text style={styles.logisticsValue}>Via app & contact details</Text>
                </View>
                <View style={styles.logisticsItem}>
                  <Text style={styles.logisticsLabel}>Payment Method</Text>
                  <Text style={styles.logisticsValue}>To be discussed</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Order items/tickets - summary view */}
        {item.type === 'ticket' && (
          <View style={styles.itemsSummary}>
            <Text style={styles.sectionTitle}>Items ({item.totalQuantity || orderItems.length}):</Text>
            {hasDetailedItems ? (
              item.ticketQuantities?.slice(0, 3).map((orderItem, index) => (
                <View key={index} style={styles.itemSummaryRow}>
                  <Text style={styles.itemSummaryTitle}>• {orderItem.type || `Item ${index + 1}`}</Text>
                  <Text style={styles.itemSummaryPrice}>{orderItem.quantity} × {orderItem.price} MAD</Text>
                </View>
              ))
            ) : orderItems.length > 0 ? (
              orderItems.slice(0, 3).map((orderItem, index) => (
                <View key={index} style={styles.itemSummaryRow}>
                  <Text style={styles.itemSummaryTitle}>• {'title' in orderItem ? orderItem.title : `Item ${index + 1}`}</Text>
                  <Text style={styles.itemSummaryPrice}>{orderItem.quantity} × {orderItem.price} MAD</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noItems}>No items details</Text>
            )}
            {(hasDetailedItems ? (item.ticketQuantities?.length || 0) : orderItems.length) > 3 && (
              <Text style={styles.moreItemsText}>
                +{(hasDetailedItems ? (item.ticketQuantities?.length || 0) : orderItems.length) - 3} more items
              </Text>
            )}
          </View>
        )}
        
        {/* Message from client */}
        {item.message && item.message.trim() && (
          <View style={styles.messageCard}>
            <Text style={styles.messageLabel}>💬 Client Message:</Text>
            <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
          </View>
        )}

        {/* View Details Button - always visible */}
        <View style={styles.viewDetailsContainer}>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => {
              console.log('🖱️ View Details pressed:', item.id, item.type);
              try {
                router.push({
                  pathname: '/(artist)/order-details',
                  params: { orderId: item.id, orderType: item.type }
                });
                console.log('✅ Navigation successful');
              } catch (error) {
                console.error('❌ Navigation failed:', error);
                Alert.alert('Error', 'Failed to navigate to order details');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.viewDetailsText}>👁️ View Full Details</Text>
          </TouchableOpacity>
        </View>
        

      </TouchableOpacity>

       {/* Action buttons - outside the touchable card */}
       {item.status === 'pending' && (
         <View style={styles.actionRow}>
           <TouchableOpacity 
             style={styles.declineButton}
             onPress={() => handleDeclineOrder(item)}
           >
             <X size={20} color="#fff" />
             <Text style={styles.buttonText}>Decline</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.acceptButton}
             onPress={() => handleAcceptOrder(item)}
           >
             <Check size={20} color="#fff" />
             <Text style={styles.buttonText}>Accept</Text>
           </TouchableOpacity>
         </View>
       )}
       
       {(item.status === 'accepted' || item.status === 'confirmed') && (
         <View style={styles.actionRow}>
           <TouchableOpacity 
             style={styles.completeButton}
             onPress={() => handleCompleteOrder(item)}
           >
             <FileText size={20} color="#fff" />
             <Text style={styles.buttonText}>Complete & Generate Invoice</Text>
           </TouchableOpacity>
         </View>
       )}

        {item.status === 'completed' && item.invoiceUrl && (
          <View style={styles.invoiceButtonContainer}>
            <TouchableOpacity
              style={styles.invoiceButton}
              onPress={() => openInvoice(item.invoiceUrl)}
            >
              <Download size={20} color="#fff" />
              <Text style={styles.invoiceButtonText}>Download Invoice</Text>
            </TouchableOpacity>
          </View>
        )}
        
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }
  
return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      
      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'accepted', 'declined'] as const).map((filter) => {
          let count = 0;
          if (filter === 'all') {
            count = orders.length;
          } else if (filter === 'accepted') {
            count = orders.filter(o => ['accepted', 'confirmed'].includes(o.status)).length;
          } else if (filter === 'declined') {
            count = orders.filter(o => ['declined', 'rejected'].includes(o.status)).length;
          } else {
            count = orders.filter(o => o.status === filter).length;
          }
          
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.activeFilterTab
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter && styles.activeFilterText
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyText}>
            When clients send you orders, they will appear here.
          </Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No {activeFilter !== 'all' ? activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1) : ''} Orders</Text>
          <Text style={styles.emptyText}>
            You don't have any {activeFilter !== 'all' ? activeFilter : ''} orders at the moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.textDark,
    marginBottom: 20,
  },
  notificationPopup: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notificationSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  notificationArrow: {
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textDark,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: '#fef3c7', // yellow light
  },
  statusAccepted: {
    backgroundColor: '#d1fae5', // green light
  },
  statusDeclined: {
    backgroundColor: '#fee2e2', // red light
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  orderDate: {
    color: Theme.colors.textLight,
    fontSize: 13,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  clientQuickInfo: {
    marginBottom: 12,
    backgroundColor: '#fef9f3',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  clientQuickRow: {
    marginBottom: 8,
  },
  clientQuickLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textDark,
  },
  clientDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  smallInfoBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  smallValue: {
    fontSize: 12,
    color: Theme.colors.textDark,
    fontWeight: '500',
  },
  addressRow: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
  },
  locationRow: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
  },
  itemsSummary: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemSummaryTitle: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.textDark,
  },
  itemSummaryPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  moreItemsText: {
    fontSize: 11,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  specialRequestsCard: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  requestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  requestText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
  messageCard: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#6b7280',
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 12,
    color: Theme.colors.textDark,
    lineHeight: 18,
  },
  viewDetailsContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  viewDetailsButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  orderDetails: {
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemTitle: {
    flex: 1,
    color: Theme.colors.textDark,
  },
  itemDetails: {
    fontWeight: '500',
    color: Theme.colors.textDark,
  },
  noItems: {
    fontStyle: 'italic',
    color: Theme.colors.textLight,
    marginBottom: 0,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
   acceptButton: {
     flex: 1,
     backgroundColor: '#10b981', // green
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 12,
     borderRadius: 8,
     marginLeft: 8,
   },
   declineButton: {
     flex: 1,
     backgroundColor: '#ef4444', // red
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 12,
     borderRadius: 8,
     marginRight: 8,
   },
   completeButton: {
     flex: 1,
     backgroundColor: '#6366f1', // indigo
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 12,
     borderRadius: 8,
   },
   invoiceButtonContainer: {
     marginTop: 8,
   },
   invoiceButton: {
     backgroundColor: '#10b981', // green for invoice
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 12,
     borderRadius: 8,
   },
   invoiceButtonText: {
     color: '#fff',
     fontWeight: '600',
     fontSize: 14,
     marginLeft: 8,
   },

  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: Theme.colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.textDark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 16,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterText: {
    fontSize: 13,
    color: Theme.colors.textLight,
    fontWeight: '500',
  },
  activeFilterText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  orderReference: {
    fontSize: 12,
    color: Theme.colors.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textDark,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderType: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginRight: 8,
    backgroundColor: Theme.colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceDetailsContainer: {
    marginBottom: 12,
  },
  detailSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: Theme.colors.textDark,
    fontWeight: '500',
  },
  requestsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  requestsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  requestsText: {
    fontSize: 12,
    color: Theme.colors.textDark,
    lineHeight: 18,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  justificationSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  justificationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  justificationText: {
    fontSize: 12,
    color: Theme.colors.textDark,
    lineHeight: 18,
  },
  notesText: {
    fontSize: 12,
    color: Theme.colors.textDark,
    lineHeight: 18,
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    padding: 12,
    borderRadius: 8,
    minWidth: '48%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  requirementContent: {
    marginLeft: 8,
    flex: 1,
  },
  requirementLabel: {
    fontSize: 12,
    color: Theme.colors.secondary,
    fontWeight: '500',
  },
  requirementValue: {
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  specificRequestsSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  financialGrid: {
    gap: 12,
  },
  financialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  financialItemFull: {
    backgroundColor: Theme.colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  financialLabel: {
    fontSize: 12,
    color: Theme.colors.secondary,
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  financialValueText: {
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 20,
    marginTop: 4,
  },
  logisticsGrid: {
    gap: 8,
  },
  logisticsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  logisticsLabel: {
    fontSize: 12,
    color: Theme.colors.secondary,
    fontWeight: '500',
  },
  logisticsValue: {
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  timelineSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  timelineDotText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textDark,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: Theme.colors.secondary,
    marginBottom: 2,
  },
  timelineStatus: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  summaryCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    padding: 12,
    borderRadius: 8,
    minWidth: '48%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: Theme.colors.secondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  statusCompleted: {
    backgroundColor: '#dbeafe', // blue light
  },
});
