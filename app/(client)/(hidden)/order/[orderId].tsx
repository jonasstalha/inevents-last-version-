import { OrderStatusBadge } from '@/src/components/orders/OrderStatusBadge';
import { db } from '@/src/firebase/firebaseConfig';
import { cancelOrder } from '@/src/firebase/orderService';
import { useAuth } from '@/src/context/AuthContext';
import { Order } from '@/src/models/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const normalizeTimestamp = (ts: any): string | undefined => {
  if (!ts) return undefined;
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  if (ts?.toDate) return ts.toDate().toISOString();
  return String(ts);
};

export default function ClientOrderDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const orderId = params.orderId as string | undefined;
    if (!orderId) {
      Alert.alert('Missing order id');
      router.back();
      return;
    }

    setLoading(true);
    const orderRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          Alert.alert('Order not found');
          router.back();
          return;
        }

        const data = snapshot.data() as any;
        setOrder({
          id: snapshot.id,
          ...data,
          createdAt: normalizeTimestamp(data.createdAt),
          updatedAt: normalizeTimestamp(data.updatedAt),
          completedAt: normalizeTimestamp(data.completedAt),
        } as Order);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading order', error);
        Alert.alert('Unable to load order details');
        router.back();
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [params.orderId]);

  const handleAcceptCounter = useCallback(async () => {
    if (!order) return;
    try {
      const orderRef = doc(db, 'orders', order.id);
      const snap = await getDoc(orderRef);
      const counterPrice = snap.data()?.counterOfferPrice;
      await updateDoc(orderRef, {
        status: 'confirmed',
        ...(counterPrice != null ? { price: counterPrice } : {}),
        updatedAt: Timestamp.now(),
      });
      Alert.alert('Accepted', 'You have accepted the artist\'s counter offer.');
    } catch (e) {
      Alert.alert('Error', 'Failed to accept counter offer');
    }
  }, [order]);

  const handleRejectCounter = useCallback(async () => {
    if (!order) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'rejected',
        updatedAt: Timestamp.now(),
      });
      Alert.alert('Declined', 'You have declined the artist\'s counter offer.');
    } catch (e) {
      Alert.alert('Error', 'Failed to decline counter offer');
    }
  }, [order]);

  const handleCancelOrder = useCallback(() => {
    if (!order || !user?.uid) return;
    Alert.alert(
      'Cancel order',
      'Cancel this order and remove its earned points? The order will also be removed from the artist\'s orders.',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(order.id, user.uid);
              Alert.alert('Order cancelled', 'The order and its earned points were removed.');
              router.back();
            } catch (error: any) {
              Alert.alert('Unable to cancel order', error?.message || 'Please try again.');
            }
          },
        },
      ],
    );
  }, [order, user?.uid, router]);

  const openInvoice = async () => {
    if (!order?.invoiceUrl) {
      Alert.alert('Invoice not available yet');
      return;
    }
    const supported = await Linking.canOpenURL(order.invoiceUrl);
    if (supported) {
      await Linking.openURL(order.invoiceUrl);
    } else {
      Alert.alert('Cannot open invoice URL');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Order details unavailable.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: order.status === 'confirmed' ? '#34c759' : order.status === 'rejected' ? '#ff3b30' : '#9e9e9e' }]}>
          <Text style={styles.name}>{order.serviceTitle || order.gigTitle || order.ticketName || 'Order'}</Text>
          <OrderStatusBadge status={order.status} />
          <Text style={styles.subtitle}>{order.type === 'service' ? 'Service order' : 'Ticket order'}</Text>
          {(() => {
            const finalPrice = order.counterOfferPrice ?? (order.totalPrice != null && order.totalPrice !== (order.clientPrice ?? order.budget) ? order.totalPrice : (order.clientPrice ?? order.budget ?? 0));
            return (
              <View style={styles.priceBlock}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#34c759' }}>{finalPrice.toFixed(2)} MAD</Text>
              </View>
            );
          })()}
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerProfile}>
            <Image
              source={{ uri: order.clientPhoto || DEFAULT_PROFILE_IMAGE }}
              style={styles.customerAvatar}
            />
            <View style={styles.customerDetails}>
              <Text style={styles.fieldText}>{order.clientName || order.clientInfo?.fullName || 'Client'}</Text>
              {order.clientInfo?.email ? <Text style={styles.fieldText}>{order.clientInfo.email}</Text> : null}
              {order.clientInfo?.phone ? <Text style={styles.fieldText}>{order.clientInfo.phone}</Text> : null}
            </View>
          </View>

          {order.status === 'counter_offered' && order.counterOfferPrice != null && (
            <View style={styles.counterOfferCard}>
              <Text style={styles.counterOfferTitle}>Artist Counter Offer</Text>
              <Text style={styles.counterOfferPrice}>{order.counterOfferPrice.toFixed(2)} MAD</Text>
              <Text style={styles.counterOfferDesc}>The artist has proposed a new price. Would you like to accept or decline?</Text>
              <View style={styles.counterOfferActions}>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptCounter}>
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={handleRejectCounter}>
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.fieldText}>{order.notes || order.description || 'No notes provided.'}</Text>

          {order.customization ? (
            <>
              <Text style={styles.sectionTitle}>Service requirements</Text>
              {order.customization.eventDate ? <Text style={styles.fieldText}>Date: {order.customization.eventDate}</Text> : null}
              {order.customization.eventTime ? <Text style={styles.fieldText}>Time: {order.customization.eventTime}</Text> : null}
              {order.customization.location ? <Text style={styles.fieldText}>Location: {order.customization.location}</Text> : null}
              {order.customization.guestCount ? <Text style={styles.fieldText}>Guests: {order.customization.guestCount}</Text> : null}
              {order.customization.specificRequests ? <Text style={styles.fieldText}>{order.customization.specificRequests}</Text> : null}
            </>
          ) : null}

          <TouchableOpacity style={[styles.invoiceButton, !order.invoiceUrl && styles.disabledButton]} onPress={openInvoice} disabled={!order.invoiceUrl}>
            <Text style={styles.invoiceButtonText}>{order.invoiceUrl ? 'Download invoice' : 'Invoice not yet ready'}</Text>
          </TouchableOpacity>

          {['pending', 'counter_offered', 'confirmed'].includes(order.status) && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  priceBlock: {
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  meta: {
    color: '#4b5563',
    marginBottom: 4,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontWeight: '700',
    fontSize: 15,
  },
  customerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  customerDetails: {
    flex: 1,
  },
  fieldText: {
    color: '#4b5563',
    marginBottom: 6,
  },
  invoiceButton: {
    marginTop: 18,
    backgroundColor: '#d1fae5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  invoiceButtonText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#4338ca',
    fontWeight: '700',
  },
  counterOfferCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  counterOfferTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3730a3',
    marginBottom: 4,
  },
  counterOfferPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4338ca',
    marginBottom: 8,
  },
  counterOfferDesc: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 14,
  },
  counterOfferActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  declineBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 15,
  },
});
