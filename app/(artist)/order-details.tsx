import { Theme } from '@/src/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Calendar, Check, Clock, MapPin, Users, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { sendOrderUpdateNotification } from '@/src/firebase/orderService';

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
  // Service customization fields
  customization?: {
    eventDate?: string;
    eventTime?: string;
    duration?: string;
    location?: string;
    guestCount?: string;
    specificRequests?: string;
  };
  priceProposal?: {
    proposedPrice?: number;
    budgetRange?: string;
    priceJustification?: string;
  };
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    additionalNotes?: string;
  };
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params.orderId && params.orderType) {
      fetchOrderDetails(params.orderId as string, params.orderType as 'ticket' | 'service');
    }
  }, [params.orderId, params.orderType]);

  const fetchOrderDetails = async (orderId: string, orderType: 'ticket' | 'service') => {
    try {
      setLoading(true);
      const db = getFirestore();
      const collectionName = orderType === 'service' ? 'customOrders' : 'orders';
      const orderRef = doc(db, collectionName, orderId);
      const orderSnapshot = await getDoc(orderRef);

      if (orderSnapshot.exists()) {
        const orderData = orderSnapshot.data();

        // Fetch client info
        let clientName = orderData.clientName || orderData.personalInfo?.fullName || 'Client';
        let clientImage = orderData.clientImage || 'https://ui-avatars.com/api/?name=Client';

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

        const orderObj: Order = {
          id: orderSnapshot.id,
          ...(orderData as Omit<Order, 'id'>),
          clientName,
          clientImage,
          type: orderType
        };

        setOrder(orderObj);
      } else {
        Alert.alert('Error', 'Order not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('Error', 'You need to be logged in to accept orders.');
        return;
      }

      const db = getFirestore();
      const collectionName = order.type === 'service' ? 'customOrders' : 'orders';
      const orderRef = doc(db, collectionName, order.id);

      const newStatus = order.type === 'service' ? 'confirmed' : 'accepted';
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    
      // Notify the client about the status change
      if (currentUser) {
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
      }

      // Update local state
      setOrder({ ...order, status: newStatus, updatedAt: new Date().toISOString() });

      Alert.alert('Order Accepted', `You have accepted this ${order.type} order.`);
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'There was a problem accepting this order. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeclineOrder = async () => {
    if (!order) return;

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
              setUpdating(true);
              const auth = getAuth();
              const currentUser = auth.currentUser;

              if (!currentUser) {
                Alert.alert('Error', 'You need to be logged in to decline orders.');
                return;
              }

              const db = getFirestore();
              const collectionName = order.type === 'service' ? 'customOrders' : 'orders';
              const orderRef = doc(db, collectionName, order.id);

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
              setOrder({ ...order, status: newStatus, updatedAt: new Date().toISOString() });

              Alert.alert('Order Declined', `You have declined this ${order.type} order.`);
            } catch (error) {
              console.error('Error declining order:', error);
              Alert.alert('Error', 'There was a problem declining this order. Please try again.');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#fef3c7';
      case 'accepted': case 'confirmed': return '#d1fae5';
      case 'declined': case 'rejected': return '#fee2e2';
      case 'completed': return '#dbeafe';
      default: return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'pending': return '#92400e';
      case 'accepted': case 'confirmed': return '#065f46';
      case 'declined': case 'rejected': return '#991b1b';
      case 'completed': return '#1e40af';
      default: return '#374151';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const orderDate = new Date(order.createdAt);
  const formattedDate = `${orderDate.toLocaleDateString()} at ${orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

  const orderItems = order.items || order.ticketQuantities || [];
  const hasDetailedItems = order.ticketQuantities && order.ticketQuantities.length > 0;
  const clientInfo = order.personalInfo || order.clientInfo;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.orderType}>
                {order.type === 'service' ? '🎨 Service Order' : '🎫 Ticket Order'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={[styles.statusText, { color: getStatusTextColor(order.status) }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.orderTitle}>
              {order.gigTitle || order.ticketName || order.serviceName || `Order ${order.id.slice(-6)}`}
            </Text>
            <Text style={styles.orderReference}>Ref: {order.orderReference || order.id.slice(-8)}</Text>
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>📊 Order Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Order Type</Text>
                <Text style={styles.summaryValue}>
                  {order.type === 'service' ? 'Custom Service' : 'Event Tickets'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>{order.totalPrice} MAD</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Quantity</Text>
                <Text style={styles.summaryValue}>{order.totalQuantity || orderItems.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Order Date</Text>
                <Text style={styles.summaryValue}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          {/* Order Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>📅 Order Timeline</Text>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot}>
                <Text style={styles.timelineDotText}>📝</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Created</Text>
                <Text style={styles.timelineDate}>{formattedDate}</Text>
                <Text style={styles.timelineStatus}>Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Text>
              </View>
            </View>
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <Text style={styles.timelineDotText}>🔄</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Last Updated</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(order.updatedAt).toLocaleDateString()} at {new Date(order.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                  <Text style={styles.timelineStatus}>Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Client Information */}
        {clientInfo && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>👤 Client Information</Text>
            <View style={styles.clientDetailsRow}>
              <View style={styles.smallInfoBox}>
                <Text style={styles.smallLabel}>Full Name</Text>
                <Text style={styles.smallValue}>{clientInfo.fullName}</Text>
              </View>
              <View style={styles.smallInfoBox}>
                <Text style={styles.smallLabel}>Email</Text>
                <Text style={styles.smallValue}>{clientInfo.email}</Text>
              </View>
            </View>
            <View style={styles.clientDetailsRow}>
              <View style={styles.smallInfoBox}>
                <Text style={styles.smallLabel}>Phone</Text>
                <Text style={styles.smallValue}>{clientInfo.phone}</Text>
              </View>
              <View style={styles.smallInfoBox}>
                <Text style={styles.smallLabel}>Country</Text>
                <Text style={styles.smallValue}>{clientInfo.country}</Text>
              </View>
            </View>
            <View style={styles.addressRow}>
              <Text style={styles.smallLabel}>Address</Text>
              <Text style={styles.smallValue}>
                {clientInfo.address}, {clientInfo.city}, {clientInfo.country}
              </Text>
            </View>
          </View>
        )}

        {/* Service Requirements & Specifications */}
        {order.type === 'service' && order.customization && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>🎯 Service Requirements</Text>
            <View style={styles.requirementsGrid}>
              {order.customization.eventDate && (
                <View style={styles.requirementItem}>
                  <Calendar size={16} color={Theme.colors.primary} />
                  <View style={styles.requirementContent}>
                    <Text style={styles.requirementLabel}>Event Date</Text>
                    <Text style={styles.requirementValue}>{order.customization.eventDate}</Text>
                  </View>
                </View>
              )}
              {order.customization.eventTime && (
                <View style={styles.requirementItem}>
                  <Clock size={16} color={Theme.colors.primary} />
                  <View style={styles.requirementContent}>
                    <Text style={styles.requirementLabel}>Event Time</Text>
                    <Text style={styles.requirementValue}>{order.customization.eventTime}</Text>
                  </View>
                </View>
              )}
              {order.customization.duration && (
                <View style={styles.requirementItem}>
                  <Text style={styles.requirementLabel}>Duration</Text>
                  <Text style={styles.requirementValue}>{order.customization.duration}</Text>
                </View>
              )}
              {order.customization.location && (
                <View style={styles.requirementItem}>
                  <MapPin size={16} color={Theme.colors.primary} />
                  <View style={styles.requirementContent}>
                    <Text style={styles.requirementLabel}>Venue Location</Text>
                    <Text style={styles.requirementValue}>{order.customization.location}</Text>
                  </View>
                </View>
              )}
              {order.customization.guestCount && (
                <View style={styles.requirementItem}>
                  <Users size={16} color={Theme.colors.primary} />
                  <View style={styles.requirementContent}>
                    <Text style={styles.requirementLabel}>Expected Guests</Text>
                    <Text style={styles.requirementValue}>{order.customization.guestCount} people</Text>
                  </View>
                </View>
              )}
            </View>

            {order.customization.specificRequests && (
              <View style={styles.specificRequestsSection}>
                <Text style={styles.requestsLabel}>🎨 Specific Requirements & Requests:</Text>
                <Text style={styles.requestsText}>{order.customization.specificRequests}</Text>
              </View>
            )}
          </View>
        )}

        {/* Financial Details */}
        {order.type === 'service' && order.priceProposal && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>💰 Financial Details</Text>
            <View style={styles.financialGrid}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Client's Proposed Price</Text>
                <Text style={styles.financialValue}>{order.priceProposal.proposedPrice} MAD</Text>
              </View>
              {order.priceProposal.budgetRange && (
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Budget Range</Text>
                  <Text style={styles.financialValue}>{order.priceProposal.budgetRange}</Text>
                </View>
              )}
              {order.realPrice && (
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Your Listed Price</Text>
                  <Text style={styles.financialValue}>{order.realPrice} MAD</Text>
                </View>
              )}
              {order.priceProposal.priceJustification && (
                <View style={styles.financialItemFull}>
                  <Text style={styles.financialLabel}>Price Justification</Text>
                  <Text style={styles.financialValueText}>{order.priceProposal.priceJustification}</Text>
                </View>
              )}
            </View>
          </View>
        )}

         {/* Order items/tickets - detailed view */}
         {order.type === 'ticket' && (
           <View style={styles.detailSection}>
             <Text style={styles.sectionTitle}>🎫 Order Items</Text>
             {hasDetailedItems ? (
               order.ticketQuantities!.map((orderItem, index) => (
                 <View key={index} style={styles.itemDetailRow}>
                   <View style={styles.itemInfo}>
                     <Text style={styles.itemTitle}>{orderItem.type || `Item ${index + 1}`}</Text>
                     <Text style={styles.itemQuantity}>Quantity: {orderItem.quantity}</Text>
                   </View>
                   <Text style={styles.itemPrice}>{orderItem.quantity} × {orderItem.price} MAD</Text>
                 </View>
               ))
             ) : orderItems.length > 0 ? (
               orderItems.map((orderItem, index) => (
                 <View key={index} style={styles.itemDetailRow}>
                   <View style={styles.itemInfo}>
                     <Text style={styles.itemTitle}>{'title' in orderItem ? orderItem.title : orderItem.type || `Item ${index + 1}`}</Text>
                     <Text style={styles.itemQuantity}>Quantity: {orderItem.quantity}</Text>
                   </View>
                   <Text style={styles.itemPrice}>{orderItem.quantity} × {orderItem.price} MAD</Text>
                 </View>
               ))
             ) : (
               <Text style={styles.noItems}>No items details available</Text>
             )}
           </View>
         )}
         
         {/* Order extras - detailed view */}
         {order.type === 'ticket' && order.extras && order.extras.length > 0 && (
           <View style={styles.detailSection}>
             <Text style={styles.sectionTitle}>✨ Order Extras</Text>
             {order.extras.map((extra, index) => (
               <View key={index} style={styles.itemDetailRow}>
                 <View style={styles.itemInfo}>
                   <Text style={styles.itemTitle}>{extra.title || `Extra ${index + 1}`}</Text>
                   <Text style={styles.itemQuantity}>Quantity: {extra.quantity}</Text>
                 </View>
                 <Text style={styles.itemPrice}>{extra.quantity} × {extra.price} MAD</Text>
               </View>
             ))}
           </View>
         )}

        {/* Message from client */}
        {order.message && order.message.trim() && (
          <View style={styles.messageCard}>
            <Text style={styles.messageLabel}>💬 Client Message:</Text>
            <Text style={styles.messageText}>{order.message}</Text>
          </View>
        )}

        {/* Additional Notes */}
        {order.personalInfo?.additionalNotes && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>📝 Additional Notes</Text>
            <Text style={styles.notesText}>{order.personalInfo.additionalNotes}</Text>
          </View>
        )}

        {/* Action buttons */}
        {order.status === 'pending' && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.declineButton, updating && styles.disabledButton]}
              onPress={handleDeclineOrder}
              disabled={updating}
            >
              <X size={20} color="#fff" />
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, updating && styles.disabledButton]}
              onPress={handleAcceptOrder}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Check size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textDark,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    color: Theme.colors.textLight,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Theme.colors.textLight,
    marginBottom: 20,
  },
  backButtonText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderType: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.textDark,
    marginBottom: 4,
  },
  orderReference: {
    fontSize: 12,
    color: Theme.colors.textLight,
    fontWeight: '500',
  },
  summaryCard: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryGrid: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    padding: 12,
    borderRadius: 8,
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
  timelineSection: {
    marginBottom: 16,
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
  detailSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  requestsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginBottom: 6,
  },
  requestsText: {
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 20,
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
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textDark,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: Theme.colors.secondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  noItems: {
    fontStyle: 'italic',
    color: Theme.colors.textLight,
    textAlign: 'center',
    padding: 20,
  },
  messageCard: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 20,
    padding: 12,
    backgroundColor: Theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textDark,
    marginBottom: 12,
  },
});