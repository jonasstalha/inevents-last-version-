import { Theme } from '@/src/constants/theme';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, query, updateDoc, where } from 'firebase/firestore';
import { Check, MessageCircle, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Order = {
  id: string;
  clientId: string;
  artistId: string;
  gigId: string;
  gigTitle: string;
  message: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  clientImage?: string;
};

export default function ArtistOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const db = getFirestore();
  
  useEffect(() => {
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
        const ordersData: Order[] = [];
        
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
                clientImage = clientData.profilePicture || clientData.profileImage || clientImage;
              }
            } catch (clientError) {
              console.error('Error fetching client details:', clientError);
            }
          }
          
          ordersData.push({
            id: docSnapshot.id,
            ...(orderData as Omit<Order, 'id'>),
            clientName,
            clientImage
          });
        }
        
        // Sort by creation date (newest first)
        ordersData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Apply filter when orders or activeFilter changes
    const applyFilter = () => {
      if (activeFilter === 'all') {
        setFilteredOrders(orders);
      } else {
        setFilteredOrders(orders.filter(order => order.status === activeFilter));
      }
    };
    
    fetchOrders();
  }, []);
  
  // Apply filter whenever orders or activeFilter changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === activeFilter));
    }
  }, [orders, activeFilter]);
  
  const handleAcceptOrder = async (order: Order) => {
    try {
      console.log('Accepting order:', order.id);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You need to be logged in to accept orders.');
        return;
      }
      
      console.log('Current user ID:', currentUser.uid);
      
      // First, get the order to verify the artist ID
      const orderRef = doc(db, 'orders', order.id);
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
      await updateDoc(orderRef, {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setOrders(orders.map(o => 
        o.id === order.id ? { ...o, status: 'accepted', updatedAt: new Date().toISOString() } : o
      ));
      
      // Create chat room or navigate to existing one
      // Navigate to chat room with this client
      router.push({
        pathname: "/(artist)/chat/[clientId]",
        params: { clientId: order.clientId }
      });
      
      Alert.alert('Order Accepted', 'You have accepted this order. You are now in a private chat with the client.');
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
                console.log('Declining order:', order.id);
                const auth = getAuth();
                const currentUser = auth.currentUser;
                
                if (!currentUser) {
                  Alert.alert('Error', 'You need to be logged in to decline orders.');
                  return;
                }
                
                console.log('Current user ID:', currentUser.uid);
                
                // First, get the order to verify the artist ID
                const orderRef = doc(db, 'orders', order.id);
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
                await updateDoc(orderRef, {
                  status: 'declined',
                  updatedAt: new Date().toISOString(),
                });
                
                // Update local state
                setOrders(orders.map(o => 
                  o.id === order.id ? { ...o, status: 'declined', updatedAt: new Date().toISOString() } : o
                ));
                
                Alert.alert('Order Declined', 'You have declined this order.');
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
  
  const renderOrderItem = ({ item }: { item: Order }) => {
    // Format date to be more readable
    const orderDate = new Date(item.createdAt);
    const formattedDate = `${orderDate.toLocaleDateString()} at ${orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderTitle}>{item.gigTitle}</Text>
          <View style={[
            styles.statusBadge, 
            item.status === 'pending' ? styles.statusPending : 
            item.status === 'accepted' ? styles.statusAccepted : styles.statusDeclined
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'pending' ? 'Pending' : 
               item.status === 'accepted' ? 'Accepted' : 'Declined'}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={styles.orderDate}>Received: {formattedDate}</Text>
          <Text style={styles.orderPrice}>{item.totalPrice} MAD</Text>
        </View>
        
        <View style={styles.orderDetails}>
          <Text style={styles.sectionTitle}>Message from client:</Text>
          <Text style={styles.message}>{item.message || 'No message provided.'}</Text>
          
          <Text style={styles.sectionTitle}>Order Items:</Text>
          {item.items && item.items.length > 0 ? (
            item.items.map((orderItem, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{orderItem.title}</Text>
                <Text style={styles.itemDetails}>
                  {orderItem.quantity} x {orderItem.price} MAD
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItems}>No items in this order.</Text>
          )}
        </View>
        
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
        
        {item.status === 'accepted' && (
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => router.push({
              pathname: "/(artist)/chat/[clientId]",
              params: { clientId: item.clientId }
            })}
          >
            <MessageCircle size={20} color="#fff" />
            <Text style={styles.buttonText}>Chat with Client</Text>
          </TouchableOpacity>
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
        {(['all', 'pending', 'accepted', 'declined'] as const).map((filter) => (
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
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              {filter === 'all' ? '' : ` (${orders.filter(o => o.status === filter).length})`}
            </Text>
          </TouchableOpacity>
        ))}
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
    marginBottom: 16,
  },
  orderDate: {
    color: Theme.colors.textLight,
    fontSize: 14,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  orderDetails: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.textDark,
    marginBottom: 8,
  },
  message: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: Theme.colors.textDark,
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
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  chatButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
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
});
