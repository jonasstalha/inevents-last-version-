import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const OrderManagementPage = () => {
  console.log('OrderManagementPage rendering');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderIds, setProcessingOrderIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();
  const router = useRouter();
  
  // Function to fetch orders that can be called to refresh
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
      
      // Query orders for this artist
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('artistId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      // Transform docs into order objects
      const ordersData: any[] = [];
      
      // Process each order and add client info
      for (const docSnapshot of querySnapshot.docs) {
        const orderData = docSnapshot.data();
        let clientName = orderData.clientName || 'Client';
        let clientImage = orderData.clientImage || 'https://ui-avatars.com/api/?name=Client';
        
        // Try to fetch client info if we have a clientId
        if (orderData.clientId) {
          try {
            const clientDoc = await getDoc(doc(db, 'users', orderData.clientId));
            if (clientDoc.exists()) {
              const clientData = clientDoc.data();
              clientName = clientData.name || clientData.displayName || clientName;
            }
          } catch (clientError) {
            console.error('Error fetching client details:', clientError);
          }
        }
        
        // Format date in a more readable way
        let timestamp = "Recently";
        if (orderData.createdAt) {
          try {
            const date = new Date(orderData.createdAt);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffHrs < 1) timestamp = "Just now";
            else if (diffHrs < 24) timestamp = `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;
            else if (diffDays < 30) timestamp = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
            else timestamp = date.toLocaleDateString();
          } catch (error) {
            console.error('Error parsing date:', error);
          }
        }
        
        ordersData.push({
          id: docSnapshot.id,
          clientName,
          clientId: orderData.clientId,
          type: 'service',
          service: orderData.gigTitle || "Custom Service",
          price: orderData.totalPrice || 0,
          clientPrice: orderData.clientPrice || null,
          message: orderData.message || "",
          status: orderData.status || "pending",
          timestamp,
          date: orderData.date,
          time: orderData.time,
          // Add any additional fields you need
          items: orderData.items || [],
          updatedAt: orderData.updatedAt || orderData.createdAt
        });
      }
      
      // Sort by creation date (newest first)
      ordersData.sort((a, b) => {
        if (!a.updatedAt && !b.updatedAt) return 0;
        if (!a.updatedAt) return 1;
        if (!b.updatedAt) return -1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handler for pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  // Fetch real orders from Firebase when component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  const [filter, setFilter] = useState('all'); // all, pending, accepted, declined
  const [counterOffer, setCounterOffer] = useState<{ [key: string]: string }>({});

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setProcessingOrderIds(prev => [...prev, orderId]);
      
      // Update the order in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'accepted',
        updatedAt: new Date().toISOString()
      });
      
      // Update the local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'accepted' }
          : order
      ));
      Alert.alert("Success", "Order accepted successfully!");
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert("Error", "Failed to accept order. Please try again.");
    } finally {
      setProcessingOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleDeclineOrder = async (orderId: string) => {
    try {
      setProcessingOrderIds(prev => [...prev, orderId]);
      
      // Update the order in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'declined',
        updatedAt: new Date().toISOString()
      });
      
      // Update the local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'declined' }
          : order
      ));
      Alert.alert("Order Declined", "Order has been declined.");
    } catch (error) {
      console.error('Error declining order:', error);
      Alert.alert("Error", "Failed to decline order. Please try again.");
    } finally {
      setProcessingOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleCounterOffer = async (orderId: string) => {
    const newPrice = counterOffer[orderId];
    if (!newPrice) {
      Alert.alert("Error", "Please enter a counter offer price");
      return;
    }
    
    try {
      setProcessingOrderIds(prev => [...prev, orderId]);
      
      // Validate price is a valid number
      const priceValue = parseFloat(newPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        Alert.alert("Error", "Please enter a valid price");
        return;
      }
      
      // Update the order in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        artistCounterPrice: priceValue,
        status: 'counter_offered',
        updatedAt: new Date().toISOString()
      });
      
      // Update the local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, price: priceValue, status: 'counter_offered' }
          : order
      ));
      setCounterOffer({ ...counterOffer, [orderId]: '' });
      Alert.alert("Counter Offer Sent", `New price of $${priceValue} has been sent to client`);
    } catch (error) {
      console.error('Error sending counter offer:', error);
      Alert.alert("Error", "Failed to send counter offer. Please try again.");
    } finally {
      setProcessingOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9500';
      case 'accepted': return '#34c759';
      case 'declined': return '#ff3b30';
      case 'counter_offered': return '#007aff';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'accepted': return 'checkmark-circle';
      case 'declined': return 'close-circle';
      case 'counter_offered': return 'swap-horizontal';
      default: return 'help-circle';
    }
  };

  return loading ? (
    <View style={[styles.container, styles.loadingContainer]}>
      <Text style={styles.loadingText}>Loading orders...</Text>
    </View>
  ) : (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#6a0dad']}
        />
      }
    >
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="mail-unread" size={24} color="#ff9500" />
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#34c759" />
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'accepted').length}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#6a0dad" />
          <Text style={styles.statValue}>
            ${orders.filter(o => o.status === 'accepted').reduce((sum, o) => sum + o.price, 0)}
          </Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'accepted', 'declined'].map(status => (
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
        
        {filteredOrders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{order.clientName}</Text>
                <Text style={styles.orderTime}>{order.timestamp}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Ionicons name={getStatusIcon(order.status)} size={16} color="white" />
                <Text style={styles.statusText}>{order.status.replace('_', ' ')}</Text>
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
                  {order.type === 'service' ? order.service : `${order.quantity}x ${order.ticketType} Tickets`}
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

            {/* Action Buttons */}
            {order.status === 'pending' && (
              <View style={styles.actionContainer}>
                <TouchableOpacity 
                  style={[styles.acceptButton, processingOrderIds.includes(order.id) && styles.disabledButton]}
                  onPress={() => handleAcceptOrder(order.id)}
                  disabled={processingOrderIds.includes(order.id)}
                >
                  {processingOrderIds.includes(order.id) ? (
                    <Text style={styles.buttonText}>Processing...</Text>
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.buttonText}>Accept</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.declineButton, processingOrderIds.includes(order.id) && styles.disabledButton]}
                  onPress={() => handleDeclineOrder(order.id)}
                  disabled={processingOrderIds.includes(order.id)}
                >
                  {processingOrderIds.includes(order.id) ? (
                    <Text style={styles.buttonText}>Processing...</Text>
                  ) : (
                    <>
                      <Ionicons name="close" size={20} color="white" />
                      <Text style={styles.buttonText}>Decline</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Counter Offer Section */}
            {order.status === 'pending' && order.clientPrice && order.clientPrice < order.price && (
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
                    style={[styles.counterOfferButton, processingOrderIds.includes(order.id) && {opacity: 0.6}]}
                    onPress={() => handleCounterOffer(order.id)}
                    disabled={processingOrderIds.includes(order.id)}
                  >
                    <Text style={styles.counterOfferButtonText}>
                      {processingOrderIds.includes(order.id) ? 'Processing...' : 'Send'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No {filter === 'all' ? '' : filter} orders found</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="add-circle" size={24} color="#6a0dad" />
          <Text style={styles.quickActionText}>Create Service Package</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="ticket" size={24} color="#6a0dad" />
          <Text style={styles.quickActionText}>Add New Event Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="settings" size={24} color="#6a0dad" />
          <Text style={styles.quickActionText}>Pricing Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 15,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    margin: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: '#6a0dad',
  },
  filterText: {
    color: '#888',
  },
  activeFilterText: {
    color: '#6a0dad',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ordersContainer: {
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderTypeText: {
    fontSize: 15,
    marginLeft: 8,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  eventName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  priceContainer: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  yourPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9500',
  },
  messageContainer: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ddd',
  },
  messageLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#444',
  },
  actionContainer: {
    flexDirection: 'row',
    marginTop: 5,
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
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  counterOfferContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  counterOfferLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  counterOfferRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterOfferInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 10,
    marginRight: 10,
  },
  counterOfferButton: {
    backgroundColor: '#007aff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  counterOfferButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  quickActions: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});

export default OrderManagementPage;
