import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { getOrderById, confirmOrder, rejectOrder, completeOrder, sendOrderUpdateNotification } from '@/src/firebase/orderService';
import { createInvoiceForOrder } from '@/src/firebase/invoiceService';
import { Order } from '@/src/models/types';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const orderId = params.orderId as string | undefined;
    if (orderId) {
      loadOrder(orderId);
    } else {
      Alert.alert('Error', 'Missing order identifier');
      router.back();
    }
  }, [params.orderId]);

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const fetched = await getOrderById(orderId);
      if (!fetched) {
        Alert.alert('Order not found');
        router.back();
        return;
      }
      setOrder(fetched);
    } catch (error) {
      console.error('Unable to load order', error);
      Alert.alert('Unable to load order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'confirm' | 'reject' | 'complete') => {
    if (!order) return;
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be signed in to perform this action');
      return;
    }

    setSaving(true);
    try {
      if (action === 'confirm') {
        await confirmOrder(order.id);
        await sendOrderUpdateNotification(
          order.clientId,
          currentUser.uid,
          order.id,
          order.type,
          'confirmed',
          'Order Confirmed',
          `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} is confirmed.`,
        );
        await createInvoiceForOrder(order);
      }
      if (action === 'reject') {
        await rejectOrder(order.id);
        await sendOrderUpdateNotification(
          order.clientId,
          currentUser.uid,
          order.id,
          order.type,
          'rejected',
          'Order Rejected',
          `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} has been rejected.`,
        );
      }
      if (action === 'complete') {
        await completeOrder(order.id);
        await sendOrderUpdateNotification(
          order.clientId,
          currentUser.uid,
          order.id,
          order.type,
          'completed',
          'Order Completed',
          `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} is completed.`,
        );
        await createInvoiceForOrder(order);
      }
      loadOrder(order.id);
      Alert.alert('Success', 'Order status updated successfully.');
    } catch (error) {
      console.error('Order update failed', error);
      Alert.alert('Unable to update order status');
    } finally {
      setSaving(false);
    }
  };

  const renderActionButtons = () => {
    if (!order) return null;
    if (order.status === 'pending') {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction('confirm')} disabled={saving}>
            <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Accept Order'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleAction('reject')} disabled={saving}>
            <Text style={styles.secondaryText}>Decline Order</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (order.status === 'confirmed') {
      return (
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction('complete')} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Mark as Completed'}</Text>
        </TouchableOpacity>
      );
    }
    return null;
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
        <Text style={styles.emptyText}>Order details were not found.</Text>
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
        <View style={styles.section}>
          <Text style={styles.label}>{order.serviceTitle || order.gigTitle || order.ticketName || 'Order'}</Text>
          <Text style={styles.status}>Status: {order.status}</Text>
          <Text style={styles.amount}>Total: {order.totalPrice?.toFixed(2)} MAD</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.fieldLabel}>{order.clientName || order.clientInfo?.fullName || 'Client'}</Text>
          {order.clientInfo?.email ? <Text style={styles.fieldText}>{order.clientInfo.email}</Text> : null}
          {order.clientInfo?.phone ? <Text style={styles.fieldText}>{order.clientInfo.phone}</Text> : null}
          {order.clientInfo?.address ? <Text style={styles.fieldText}>{order.clientInfo.address}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.fieldLabel}>Type</Text>
          <Text style={styles.fieldText}>{order.type}</Text>
          <Text style={styles.fieldLabel}>Created</Text>
          <Text style={styles.fieldText}>{new Date(order.createdAt).toLocaleString()}</Text>
          {order.notes ? <Text style={styles.fieldLabel}>Notes</Text> : null}
          {order.notes ? <Text style={styles.fieldText}>{order.notes}</Text> : null}
          {order.description ? <Text style={styles.fieldLabel}>Description</Text> : null}
          {order.description ? <Text style={styles.fieldText}>{order.description}</Text> : null}
        </View>

        {order.customization ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Requirements</Text>
            {order.customization.eventDate ? <Text style={styles.fieldText}>Date: {order.customization.eventDate}</Text> : null}
            {order.customization.eventTime ? <Text style={styles.fieldText}>Time: {order.customization.eventTime}</Text> : null}
            {order.customization.location ? <Text style={styles.fieldText}>Location: {order.customization.location}</Text> : null}
            {order.customization.guestCount ? <Text style={styles.fieldText}>Guests: {order.customization.guestCount}</Text> : null}
            {order.customization.specificRequests ? <Text style={styles.fieldText}>{order.customization.specificRequests}</Text> : null}
          </View>
        ) : null}

        <View style={styles.section}>{renderActionButtons()}</View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '600',
  },
  fieldText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4338ca',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#991b1b',
    fontWeight: '700',
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
