import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/firebase/firebaseConfig';
import { Order } from '@/src/models/types';
import { OrderStatusBadge } from '@/src/components/orders/OrderStatusBadge';

export default function ClientOrderDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
        <View style={styles.card}>
          <Text style={styles.name}>{order.serviceTitle || order.gigTitle || order.ticketName || 'Order'}</Text>
          <OrderStatusBadge status={order.status} />
          <Text style={styles.subtitle}>{order.type === 'service' ? 'Service order' : 'Ticket order'}</Text>
          <Text style={styles.amount}>{order.totalPrice.toFixed(2)} MAD</Text>
          <Text style={styles.meta}>Payment: {order.paymentStatus || 'unpaid'}</Text>
          <Text style={styles.meta}>Created: {new Date(order.createdAt).toLocaleString()}</Text>

          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.fieldText}>{order.clientName || order.clientInfo?.fullName || 'Client'}</Text>
          {order.clientInfo?.email ? <Text style={styles.fieldText}>{order.clientInfo.email}</Text> : null}
          {order.clientInfo?.phone ? <Text style={styles.fieldText}>{order.clientInfo.phone}</Text> : null}

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
});
