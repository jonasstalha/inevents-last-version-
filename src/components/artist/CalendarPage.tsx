import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchServicesByArtistId } from '../../firebase/artistServices';
import { createInvoiceForOrder } from '../../firebase/invoiceService';
import { confirmOrder, rejectOrder, sendCounterOffer, sendOrderUpdateNotification, warnClientCancellation } from '../../firebase/orderService';

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
  budget?: number;
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
  counterOfferPrice?: number;
  items?: any[];
  serviceImage?: string;
  cover?: string;
  image?: string;
}

function getOrderTimestamp(value: unknown): number {
  if (!value) return Number.NaN;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') {
    return value < 10000000000 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) && /^\d+$/.test(value)
      ? getOrderTimestamp(Number(value))
      : parsed;
  }
  if (typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (typeof seconds === 'number') return seconds * 1000;
  }
  return Number.NaN;
}

function normalizeOrderTimestamp(value: unknown): string | undefined {
  const timestamp = getOrderTimestamp(value);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
}

const CalendarPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');
  const [orderType, setOrderType] = useState<'all' | Order['type']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [counterOffer, setCounterOffer] = useState<{ [key: string]: string }>({});
  const [savingIds, setSavingIds] = useState<string[]>([]);
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
        const [globalOrdersSnapshot, activeServices] = await Promise.all([
          getDocs(globalOrdersQuery),
          fetchServicesByArtistId(currentUser.uid),
        ]);
        const activeServiceIds = new Set(activeServices.map((service) => String(service.id)));
        
        console.log('📊 Found', globalOrdersSnapshot.size, 'orders in global collection');

        const ordersData: Order[] = globalOrdersSnapshot.docs.filter((doc) => {
          const data = doc.data() as any;
          const isTicketOrder = !!(data.ticketQuantities?.length || data.ticketId || data.ticketName || data.ticketType);
          if (isTicketOrder) return true;

          const serviceId = data.serviceId || data.gigId;
          return !serviceId || activeServiceIds.has(String(serviceId));
        }).map(doc => {
          const data = doc.data() as any;
          const isTicketOrder = !!(data.ticketQuantities?.length || data.ticketId || data.ticketName || data.ticketType);
          const resolvedClientName = data.clientInfo?.fullName || data.clientName || 'Unknown Client';
          const resolvedQuantity = data.quantity || data.totalQuantity || data.ticketQuantities?.reduce((sum: number, ticket: any) => sum + (ticket.quantity || 0), 0);
          const resolvedTicketType = data.ticketType || data.ticketName || (data.ticketQuantities?.length ? data.ticketQuantities.map((ticket: any) => `${ticket.quantity}x ${ticket.type}`).join(', ') : undefined);
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
            price: data.price,
            totalPrice: data.totalPrice,
            clientPrice: data.clientPrice,
            budget: data.budget,
            message: data.message,
            status: normalizedStatus,
            timestamp: normalizeOrderTimestamp(data.timestamp) || normalizeOrderTimestamp(data.createdAt),
            createdAt: normalizeOrderTimestamp(data.createdAt),
            eventName: data.eventName,
            quantity: resolvedQuantity,
            ticketType: resolvedTicketType,
            ticketName: data.ticketName,
            ticketQuantities: data.ticketQuantities,
            clientInfo: data.clientInfo,
            clientId: data.clientId,
            artistId: data.artistId,
            gigId: data.gigId,
            counterOfferPrice: data.counterOfferPrice,
            items: data.items,
            serviceImage: data.serviceImage || data.cover || data.image || data.coverImage,
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

  const handleCounterOffer = async (orderId: string) => {
    const newPrice = counterOffer[orderId];
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      Alert.alert('Error', 'Please enter a valid counter offer price');
      return;
    }
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const priceNum = parseFloat(newPrice);
    try {
      setSavingIds(prev => [...prev, orderId]);
      await sendCounterOffer(orderId, priceNum);
      setOrders(orders.map(o =>
        o.id === orderId ? { ...o, price: priceNum, status: 'counter_offered' as any } : o
      ));
      setCounterOffer({ ...counterOffer, [orderId]: '' });
      await sendOrderUpdateNotification(
        order.clientId,
        order.artistId,
        orderId,
        order.type as any,
        'counter_offered' as any,
        'New Price Offer',
        `The artist has sent a counter offer of ${priceNum} MAD for your order.`,
      );
      Alert.alert('Counter Offer Sent', `New price of ${priceNum} MAD has been sent to client`);
    } catch (err) {
      console.error('Counter offer failed:', err);
      Alert.alert('Error', 'Failed to send counter offer');
    } finally {
      setSavingIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return orders.filter(order => {
      const matchesStatus = filter === 'all' || order.status === filter;
      const matchesType = orderType === 'all' || order.type === orderType;
      const searchableText = [
        order.id,
        order.clientName,
        order.service,
        order.serviceTitle,
        order.gigTitle,
        order.ticketName,
        order.ticketType,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesStatus && matchesType && matchesSearch;
    }).sort((firstOrder, secondOrder) => {
      const firstTime = getOrderTimestamp(firstOrder.createdAt || firstOrder.timestamp);
      const secondTime = getOrderTimestamp(secondOrder.createdAt || secondOrder.timestamp);

      if (Number.isNaN(firstTime) && Number.isNaN(secondTime)) return 0;
      if (Number.isNaN(firstTime)) return 1;
      if (Number.isNaN(secondTime)) return -1;
      const timeDifference = secondTime - firstTime;
      return timeDifference || secondOrder.id.localeCompare(firstOrder.id);
    });
  }, [orders, filter, orderType, searchQuery]);

  const statusFilters: Array<{ id: 'all' | Order['status']; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'counter_offered', label: 'Counter offer' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const getStatusCount = (status: 'all' | Order['status']) =>
    status === 'all' ? orders.length : orders.filter(order => order.status === status).length;

  const formatFilterLabel = (value: string) =>
    value === 'counter_offered' ? 'Counter offer' : value.charAt(0).toUpperCase() + value.slice(1);

  const hasActiveFilters = Boolean(searchQuery.trim()) || filter !== 'all' || orderType !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilter('all');
    setOrderType('all');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'counter_offered': return '#9e9e9e';
      case 'confirmed': return '#34c759';
      case 'rejected': return '#ff3b30';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle';
      case 'counter_offered': return 'pricetag';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 180 : 160 }}
    >
      {/* Search and filters */}
      <View style={styles.filterPanel}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={19} color="#7b8190" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search client, service, or order ID"
            placeholderTextColor="#9aa1af"
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={19} color="#9aa1af" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterHeadingRow}>
          <Text style={styles.filterHeading}>Order status</Text>
          <View style={styles.resultActions}>
            <Text style={styles.resultCount}>{filteredOrders.length} shown</Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} hitSlop={8}>
                <Text style={styles.clearFiltersText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {statusFilters.map(({ id, label }) => (
          <TouchableOpacity
            key={id}
            style={[styles.filterTab, filter === id && styles.activeFilterTab]}
            onPress={() => setFilter(id)}
          >
            <Text style={[styles.filterText, filter === id && styles.activeFilterText]}>
              {label}
            </Text>
            <View style={[styles.countBadge, filter === id && styles.activeCountBadge]}>
              <Text style={[styles.countBadgeText, filter === id && styles.activeCountBadgeText]}>{getStatusCount(id)}</Text>
            </View>
          </TouchableOpacity>
        ))}
        </ScrollView>

        <Text style={styles.filterHeading}>Order type</Text>
        <View style={styles.typeFilterRow}>
          {[
            { id: 'all' as const, label: 'All types', icon: 'apps-outline' as const },
            { id: 'service' as const, label: 'Services', icon: 'briefcase-outline' as const },
            { id: 'ticket' as const, label: 'Tickets', icon: 'ticket-outline' as const },
          ].map(type => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeFilter, orderType === type.id && styles.typeFilterActive]}
              onPress={() => setOrderType(type.id)}
            >
              <Ionicons name={type.icon} size={16} color={orderType === type.id ? '#fff' : '#697386'} />
              <Text style={[styles.typeFilterText, orderType === type.id && styles.typeFilterTextActive]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Orders List */}
      <View style={styles.ordersContainer}>
        <Text style={styles.sectionTitle}>
          {filter === 'all' ? 'All Orders' : `${formatFilterLabel(filter)} Orders`}
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
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}> 
          <Ionicons name={getStatusIcon(order.status)} size={16} color="white" />
          <Text style={styles.statusText}>{order.status.replace('_', ' ')}</Text>
        </View>
      </View>
    </View>
    {/* Service Image */}
    {(order.serviceImage || order.cover || order.image) ? (
      <Image source={{ uri: order.serviceImage || order.cover || order.image }} style={styles.serviceImage} />
    ) : null}
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
        <Text style={styles.priceLabel}>Budget:</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#34c759' }}>
          ${order.clientPrice ?? order.budget ?? order.totalPrice ?? 0}
        </Text>
      </View>
      {order.counterOfferPrice != null && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Your Offer:</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#6a0dad' }}>
            ${order.counterOfferPrice}
          </Text>
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
    {order.status === 'pending' && (
      <View style={styles.counterOfferContainer}>
        <Text style={styles.counterOfferLabel}>Send Back Price:</Text>
        <View style={styles.counterOfferRow}>
          <TextInput
            style={styles.counterOfferInput}
            placeholder="Enter your price"
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
  filterPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8eaf0',
    shadowColor: '#1d2340',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  searchContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#eceef4',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#202536',
    fontSize: 14,
    marginLeft: 9,
    paddingVertical: 0,
  },
  filterHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  filterHeading: {
      filterHeadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 9,
      },
      resultActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      },
  },
  resultCount: {
    color: '#8b92a3',
    fontSize: 12,
    fontWeight: '600',
  },
  clearFiltersText: {
    color: '#6a0dad',
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    paddingBottom: 4,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#f5f6fa',
    borderWidth: 1,
    borderColor: '#f0f1f5',
  },
  activeFilterTab: {
    backgroundColor: '#6a0dad',
    borderColor: '#6a0dad',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e7e9f0',
    marginLeft: 7,
    paddingHorizontal: 5,
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  countBadgeText: {
    color: '#697386',
    fontSize: 11,
    fontWeight: '700',
  },
  activeCountBadgeText: {
    color: '#fff',
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeFilter: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#f5f6fa',
    borderWidth: 1,
    borderColor: '#f0f1f5',
  },
  typeFilterActive: {
    backgroundColor: '#283b63',
    borderColor: '#283b63',
  },
  typeFilterText: {
    color: '#697386',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  typeFilterTextActive: {
    color: '#fff',
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
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  serviceImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
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
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  customerPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007aff',
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
