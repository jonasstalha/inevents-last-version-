import { toTimestampString } from '@/src/utils/timestampUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createInvoiceForOrder } from '../../firebase/invoiceService';
import { confirmOrder, rejectOrder, sendOrderUpdateNotification, warnClientCancellation } from '../../firebase/orderService';

interface Order {
  id: string;
  type: 'service' | 'ticket' | 'gig';
  clientName: string;
  service?: string;
  serviceTitle?: string;
  gigTitle?: string;
  date?: string;
  time?: string;
  price?: number;
  totalPrice?: number;
  clientPrice?: number;
  message?: string;
  status: 'pending' | 'confirmed' | 'rejected'  | 'counter_offered' | 'accepted' | 'declined';
  timestamp?: string;
  createdAt?: string;
  eventName?: string;
  quantity?: number;
  ticketType?: string;
  ticketName?: string;
  ticketQuantities?: Array<{
    type: string;
    price: number;
    quantity: number;
  }>;
  clientInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  clientId?: string;
  artistId?: string;
  gigId?: string;
  items?: any[];
}

interface ReclamationState {
  selectedReasons: string[];
  details: string;
  submitting: boolean;
  expanded: boolean;
  saved: boolean;
}

const reclamationReasons = [
  'Incorrect date/time',
  'Missing details',
  'Price discrepancy',
  'Client info issue',
  'Other',
];

const CalendarPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [counterOffer, setCounterOffer] = useState<{ [key: string]: string }>({});
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [reclamations, setReclamations] = useState<Record<string, ReclamationState>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log('No user logged in');
          setLoading(false);
          return;
        }

        console.log('📋 Fetching orders for artist:', currentUser.uid);

        const globalOrdersCol = collection(db, 'orders');
        const globalOrdersQuery = query(globalOrdersCol, where('artistId', '==', currentUser.uid));
        const globalOrdersSnapshot = await getDocs(globalOrdersQuery);
        
        console.log('📊 Found', globalOrdersSnapshot.size, 'orders in global collection');

        const ordersData: Order[] = globalOrdersSnapshot.docs.map(doc => {
          const data = doc.data() as any;
          const isTicketOrder = !!(data.ticketQuantities?.length || data.ticketId || data.ticketName || data.ticketType);
          const resolvedClientName = data.clientInfo?.fullName || data.clientName || 'Unknown Client';
          const resolvedQuantity = data.quantity || data.totalQuantity || data.ticketQuantities?.reduce((sum: number, ticket: any) => sum + (ticket.quantity || 0), 0);
          const resolvedTicketType = data.ticketType || data.ticketName || (data.ticketQuantities?.length ? data.ticketQuantities.map((ticket: any) => `${ticket.quantity}x ${ticket.type}`).join(', ') : undefined);
          const resolvedPrice = data.price || data.totalPrice;
          const rawStatus = data.status || 'pending';
          const normalizedStatus = rawStatus === 'accepted' ? 'confirmed' : rawStatus === 'declined' ? 'rejected' : rawStatus;

          return {
            id: doc.id,
            type: data.type || (isTicketOrder ? 'ticket' : 'service'),
            clientName: resolvedClientName,
            service: data.service || data.gigTitle,
            serviceTitle: data.serviceTitle,
            gigTitle: data.gigTitle,
            date: data.date,
            time: data.time,
            price: resolvedPrice,
            totalPrice: data.totalPrice,
            clientPrice: data.clientPrice,
            message: data.message,
            status: normalizedStatus,
            timestamp: toTimestampString(data.timestamp) || toTimestampString(data.createdAt),
            createdAt: toTimestampString(data.createdAt),
            eventName: data.eventName,
            quantity: resolvedQuantity,
            ticketType: resolvedTicketType,
            ticketName: data.ticketName,
            ticketQuantities: data.ticketQuantities,
            clientInfo: data.clientInfo,
            clientId: data.clientId,
            artistId: data.artistId,
            gigId: data.gigId,
            items: data.items,
          };
        });

        console.log('✅ Loaded', ordersData.length, 'total orders');
        ordersData.forEach(order => {
          console.log(`  - Order ${order.id}: ${order.clientName} - ${order.status}`);
        });
        
        setOrders(ordersData);
      } catch (error) {
        console.error('❌ Error fetching orders:', error);
        Alert.alert('Error', 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleAcceptOrder = async (orderId: string) => {
    const order = orders.find((order) => order.id === orderId);
    if (!order) {
      Alert.alert('Error', 'Order not found');
      return;
    }

    const previousStatus = order.status;
    let statusUpdated = false;
    setSavingIds((prev) => [...prev, orderId]);
    setOrders((prev) => prev.map((item) => item.id === orderId ? { ...item, status: 'confirmed' } : item));
    try {
      await confirmOrder(orderId);
      statusUpdated = true;

      if (order.clientId && order.artistId) {
        try {
          await sendOrderUpdateNotification(
            order.clientId,
            order.artistId,
            order.id,
            order.type === 'gig' ? 'service' : order.type,
            'confirmed',
            'Order Confirmed',
            `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} is confirmed.`,
          );
        } catch (notificationError) {
          console.warn('Order confirmed but notification failed:', notificationError);
        }
      }

      try {
        await createInvoiceForOrder(order as any);
      } catch (invoiceError) {
        console.warn('Order confirmed but invoice creation failed:', invoiceError);
      }

      Alert.alert('Order Confirmed', 'Order accepted successfully!');
    } catch (error) {
      console.error('Failed to confirm order:', error);
      if (!statusUpdated) {
        setOrders((prev) => prev.map((item) => item.id === orderId ? { ...item, status: previousStatus } : item));
      }
      Alert.alert('Error', 'Unable to confirm order.');
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleDeclineOrder = async (orderId: string) => {
    const order = orders.find((order) => order.id === orderId);
    if (!order) {
      Alert.alert('Error', 'Order not found');
      return;
    }

    const previousStatus = order.status;
    let statusUpdated = false;
    setSavingIds((prev) => [...prev, orderId]);
    setOrders((prev) => prev.map((item) => item.id === orderId ? { ...item, status: 'rejected' } : item));
    try {
      await rejectOrder(orderId);
      statusUpdated = true;

      let clientDeleted = false;
      if (order.clientId) {
        try {
          clientDeleted = await warnClientCancellation(order.clientId, order.id);
        } catch (warningError) {
          console.warn('Cancellation alert update failed:', warningError);
        }
      }

      if (order.clientId && order.artistId) {
        try {
          await sendOrderUpdateNotification(
            order.clientId,
            order.artistId,
            order.id,
            order.type === 'gig' ? 'service' : order.type,
            'rejected',
            'Order Rejected',
            `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} was rejected.`,
          );
        } catch (notificationError) {
          console.warn('Order rejected but notification failed:', notificationError);
        }
      }

      if (clientDeleted) {
        Alert.alert('Client Removed', 'Client account has been removed after 3 cancellation alerts.');
      } else {
        Alert.alert('Order Rejected', 'Order has been rejected.');
      }
    } catch (error) {
      console.error('Failed to reject order:', error);
      if (!statusUpdated) {
        setOrders((prev) => prev.map((item) => item.id === orderId ? { ...item, status: previousStatus } : item));
      }
      Alert.alert('Error', 'Unable to reject order.');
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleCounterOffer = (orderId: string) => {
    const newPrice = counterOffer[orderId];
    if (!newPrice) {
      Alert.alert('Error', 'Please enter a counter offer price');
      return;
    }
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, price: parseFloat(newPrice), status: 'counter_offered' } : order
    ));
    setCounterOffer({ ...counterOffer, [orderId]: '' });
    Alert.alert('Counter Offer Sent', `New price of ${newPrice} MAD has been sent to client`);
  };

  const toggleReclamationPanel = (orderId: string) => {
    setReclamations(prev => ({
      ...prev,
      [orderId]: {
        selectedReasons: prev[orderId]?.selectedReasons || [],
        details: prev[orderId]?.details || '',
        submitting: prev[orderId]?.submitting || false,
        expanded: !prev[orderId]?.expanded,
        saved: prev[orderId]?.saved || false,
      },
    }));
  };

  const toggleReclamationReason = (orderId: string, reason: string) => {
    setReclamations(prev => {
      const current = prev[orderId] || { selectedReasons: [], details: '', submitting: false, expanded: true, saved: false };
      const isSelected = current.selectedReasons.includes(reason);
      const selectedReasons = isSelected
        ? current.selectedReasons.filter(item => item !== reason)
        : [...current.selectedReasons, reason];
      return {
        ...prev,
        [orderId]: { ...current, selectedReasons },
      };
    });
  };

  const updateReclamationDetails = (orderId: string, details: string) => {
    setReclamations(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || { selectedReasons: [], submitting: false, expanded: true, saved: false }),
        details,
      },
    }));
  };

  const handleSaveReclamation = async (order: Order) => {
    const reclamation = reclamations[order.id] || { selectedReasons: [], details: '', submitting: false, expanded: true, saved: false };
    if (!reclamation.selectedReasons.length) {
      Alert.alert('Select a reason', 'Please choose at least one reclamation reason.');
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Not signed in', 'Please sign in to submit a reclamation.');
      return;
    }

    setReclamations(prev => ({
      ...prev,
      [order.id]: { ...reclamation, submitting: true },
    }));

    try {
      const db = getFirestore();
      await addDoc(collection(db, 'reclamations'), {
        orderId: order.id,
        artistId: currentUser.uid,
        clientId: order.clientId || null,
        reasons: reclamation.selectedReasons,
        details: reclamation.details.trim() || null,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        orderSummary: {
          type: order.type,
          status: order.status,
          price: order.price,
          date: order.date,
          time: order.time,
          clientName: order.clientName,
        },
      });

      setReclamations(prev => ({
        ...prev,
        [order.id]: { ...reclamation, submitting: false, saved: true, expanded: false },
      }));
      Alert.alert('Reclamation submitted', 'Your issue has been saved in Firebase.');
    } catch (error) {
      console.error('Failed to save reclamation:', error);
      setReclamations(prev => ({
        ...prev,
        [order.id]: { ...reclamation, submitting: false },
      }));
      Alert.alert('Error', 'Unable to save reclamation. Please try again later.');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9500';
      case 'confirmed': return '#34c759';
      case 'rejected': return '#ff3b30';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'confirmed', 'rejected'].map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, filter === status && styles.activeFilterTab]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.activeFilterText]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <View style={styles.ordersContainer}>
        <Text style={styles.sectionTitle}>
          {filter === 'all' ? 'All Orders' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Orders`}
        </Text>
        <Text style={styles.sectionSubtitle}>
          Review bookings, respond quickly, or submit a reclamation for any issue.
        </Text>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        )}

        {/* Orders */}
{!loading && filteredOrders.map(order => (
  <TouchableOpacity
    key={order.id}
    style={styles.orderCard}
    activeOpacity={0.7}
    onPress={() => router.push({
      pathname: '/(artist)/order-details',
      params: { orderId: order.id },
    })}
  >
    {/* Order Header */}
    <View style={styles.orderHeader}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{order.clientName}</Text>
        <Text style={styles.orderTime}>{order.timestamp}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.reportIconButton, reclamations[order.id]?.saved && styles.disabledButton]}
          onPress={() => toggleReclamationPanel(order.id)}
          disabled={reclamations[order.id]?.submitting}
        >
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={reclamations[order.id]?.saved ? '#999' : '#ff6b6b'}
          />
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}> 
          <Ionicons name={getStatusIcon(order.status)} size={16} color="white" />
          <Text style={styles.statusText}>{order.status.replace('_', ' ')}</Text>
        </View>
      </View>
    </View>
    {/* Order Details */}
    <View style={styles.orderDetails}>
      <View style={styles.orderType}>
        <Ionicons 
          name={order.type === 'service' ? 'musical-notes' : 'ticket'} 
          size={20} 
          color="#6a0dad" 
        />
        <Text style={styles.orderTypeText}>
          {order.type === 'service'
            ? (order.service || order.gigTitle || 'Service Order')
            : (order.ticketType || order.ticketName || `${order.quantity || 0}x Tickets`)}
        </Text>
      </View>
      {order.date && (
        <Text style={styles.orderDate}>📅 {order.date} at {order.time}</Text>
      )}
      {order.eventName && (
        <Text style={styles.eventName}>🎵 {order.eventName}</Text>
      )}
    </View>
    {/* Price Information */}
    <View style={styles.priceContainer}>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Your Price:</Text>
        <Text style={styles.yourPrice}>${order.price}</Text>
      </View>
      {order.clientPrice && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Client Offer:</Text>
          <Text style={styles.clientPrice}>${order.clientPrice}</Text>
        </View>
      )}
    </View>
    {/* Client Message */}
    {order.message && (
      <View style={styles.messageContainer}>
        <Text style={styles.messageLabel}>Message:</Text>
        <Text style={styles.messageText}>"{order.message}"</Text>
      </View>
    )}
    {reclamations[order.id]?.expanded && (
      <View style={styles.reclamationPanel}>
          <Text style={styles.reclamationTitle}>Choose issue(s)</Text>
          <View style={styles.reasonList}>
            {reclamationReasons.map(reason => {
              const selected = reclamations[order.id]?.selectedReasons.includes(reason);
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonButton, selected && styles.reasonButtonSelected]}
                  onPress={() => toggleReclamationReason(order.id, reason)}
                >
                  <Text style={[styles.reasonButtonText, selected && styles.reasonButtonTextSelected]}>{reason}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={styles.reclamationInput}
            placeholder="Add optional details"
            placeholderTextColor="#999"
            multiline
            value={reclamations[order.id]?.details || ''}
            onChangeText={(text) => updateReclamationDetails(order.id, text)}
          />
          <TouchableOpacity
            style={[styles.saveReclamationButton, reclamations[order.id]?.submitting && styles.disabledButton]}
            onPress={() => handleSaveReclamation(order)}
            disabled={reclamations[order.id]?.submitting}
          >
            <Text style={styles.buttonText}>
              {reclamations[order.id]?.submitting ? 'Saving...' : 'Submit Reclamation'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    {/* Action Buttons */}
    {order.status === 'pending' && (
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.acceptButton, savingIds.includes(order.id) && styles.disabledButton]}
          onPress={() => handleAcceptOrder(order.id)}
          disabled={savingIds.includes(order.id)}
        >
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.declineButton, savingIds.includes(order.id) && styles.disabledButton]}
          onPress={() => handleDeclineOrder(order.id)}
          disabled={savingIds.includes(order.id)}
        >
          <Ionicons name="close" size={20} color="white" />
          <Text style={styles.buttonText}>Refuse</Text>
        </TouchableOpacity>
      </View>
    )}
    {/* Counter Offer Section */}
    {order.status === 'pending' && order.clientPrice != null && (order.price ?? 0) < order.clientPrice && (
      <View style={styles.counterOfferContainer}>
        <Text style={styles.counterOfferLabel}>Counter Offer:</Text>
        <View style={styles.counterOfferRow}>
          <TextInput
            style={styles.counterOfferInput}
            placeholder="Enter price"
            keyboardType="numeric"
            value={counterOffer[order.id] || ''}
            onChangeText={(text) => setCounterOffer({...counterOffer, [order.id]: text})}
          />
          <TouchableOpacity 
            style={styles.counterOfferButton}
            onPress={() => handleCounterOffer(order.id)}
          >
            <Text style={styles.counterOfferButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
  </TouchableOpacity>
))}
        {!loading && filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No {filter === 'all' ? '' : filter} orders found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#6a0dad',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  ordersContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventName: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  yourPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34c759',
  },
  clientPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9500',
  },
  messageContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#34c759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  counterOfferContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  counterOfferLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  reclaimBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ececec',
    paddingTop: 12,
  },
  reclaimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    paddingVertical: 10,
    borderRadius: 8,
  },
  reclamationPanel: {
    marginTop: 12,
    backgroundColor: '#faf7ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ede7f6',
  },
  reclamationTitle: {
    fontSize: 14,
    color: '#4b2995',
    fontWeight: '600',
    marginBottom: 8,
  },
  reasonList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  reasonButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    marginRight: 8,
  },
  reasonButtonSelected: {
    backgroundColor: '#6a0dad',
    borderColor: '#6a0dad',
  },
  reasonButtonText: {
    fontSize: 12,
    color: '#444',
  },
  reasonButtonTextSelected: {
    color: 'white',
  },
  reclamationInput: {
    minHeight: 64,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  saveReclamationButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  counterOfferRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterOfferInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    fontSize: 16,
  },
  counterOfferButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  counterOfferButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default CalendarPage;
