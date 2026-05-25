import { OrderStatusBadge } from '@/src/components/orders/OrderStatusBadge';
import { useAuth } from '@/src/context/AuthContext';
import { createInvoiceForOrder } from '@/src/firebase/invoiceService';
import { completeOrder, confirmOrder, rejectOrder, sendOrderUpdateNotification } from '@/src/firebase/orderService';
import { useArtistOrders } from '@/src/hooks/useArtistOrders';
import { Order, OrderStatus } from '@/src/models/types';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const orderTabs = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ArtistOrdersScreen() {
  const router = useRouter();
  const { orders, loading, error } = useArtistOrders();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'rejected'>('all');
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [localStatusUpdates, setLocalStatusUpdates] = useState<Record<string, OrderStatus>>({});

  const enrichedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      status: localStatusUpdates[order.id] ?? order.status,
    }));
  }, [orders, localStatusUpdates]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return enrichedOrders;
    return enrichedOrders.filter((order) => order.status === activeTab);
  }, [enrichedOrders, activeTab]);

  const updateOrder = async (order: Order, action: 'confirm' | 'reject' | 'complete') => {
    try {
      // Debug: verify current user and ownership before updating
      const currentUid = user?.uid;
      console.log('Artist action requested', { currentUid, orderId: order.id, orderArtistId: order.artistId, action });

      if (!currentUid || currentUid !== order.artistId) {
        console.error('Current user is not the artist for this order', { currentUid, orderArtistId: order.artistId, orderId: order.id });
        Alert.alert('Permission denied', 'You are not authorized to update this order.');
        return;
      }

      setSavingIds((prev) => [...prev, order.id]);
      if (action === 'confirm') {
        await confirmOrder(order.id);
        await sendOrderUpdateNotification(
          order.clientId,
          order.artistId,
          order.id,
          order.type,
          'confirmed',
          'Order Confirmed',
          `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} is confirmed.`,
        );
        await createInvoiceForOrder(order);
        setLocalStatusUpdates((prev) => ({ ...prev, [order.id]: 'confirmed' }));
      }
      if (action === 'reject') {
        await rejectOrder(order.id);
        await sendOrderUpdateNotification(
          order.clientId,
          order.artistId,
          order.id,
          order.type,
          'rejected',
          'Order Rejected',
          `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} was rejected.`,
        );
        setLocalStatusUpdates((prev) => ({ ...prev, [order.id]: 'rejected' }));
      }
      if (action === 'complete') {
        await completeOrder(order.id);
        await sendOrderUpdateNotification(
          order.clientId,
          order.artistId,
          order.id,
          order.type,
          'completed',
          'Order Completed',
          `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} has been completed.`,
        );
        await createInvoiceForOrder(order);
        setLocalStatusUpdates((prev) => ({ ...prev, [order.id]: 'completed' }));
      }
      console.log('Artist updated order status successfully', { orderId: order.id, action });
      Alert.alert('Success', `Order ${action === 'confirm' ? 'accepted' : action === 'reject' ? 'rejected' : 'completed'} successfully.`);
    } catch (err) {
      console.error('Order update failed', { err, orderId: order.id });
      const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
      Alert.alert('Error', msg);
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== order.id));
    }
  };

  const handleOpenInvoice = async (invoiceUrl?: string) => {
    if (!invoiceUrl) {
      Alert.alert('Invoice not available yet');
      return;
    }
    const supported = await Linking.canOpenURL(invoiceUrl);
    if (supported) {
      await Linking.openURL(invoiceUrl);
    } else {
      Alert.alert('Cannot open invoice URL');
    }
  };

  const renderItem = ({ item }: { item: Order }) => {
    const isSaving = savingIds.includes(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>{item.serviceTitle || item.gigTitle || item.ticketName || 'Order'}</Text>
            <Text style={styles.cardSubtitle}>{item.type === 'service' ? 'Service order' : 'Ticket order'}</Text>
          </View>
          <OrderStatusBadge status={item.status} />
        </View>

        <Text style={styles.priceText}>{item.totalPrice?.toFixed(2)} MAD</Text>
        <Text style={styles.metaText}>Client: {item.clientName || 'Unknown'}</Text>
        <Text style={styles.metaText}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.detailButton} onPress={() => router.push(`/(artist)/order-details?orderId=${item.id}&orderType=${item.type}`)}>
            <Text style={styles.detailButtonText}>Details</Text>
          </TouchableOpacity>
          {item.invoiceUrl ? (
            <TouchableOpacity style={styles.invoiceButton} onPress={() => handleOpenInvoice(item.invoiceUrl)}>
              <Text style={styles.invoiceText}>View Invoice</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.actionGroup}>
          {item.status === 'pending' ? (
            <>
              <TouchableOpacity style={styles.primaryButton} disabled={isSaving} onPress={() => updateOrder(item, 'confirm')}>
                <Text style={styles.primaryButtonText}>{isSaving ? 'Processing...' : 'Accept'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} disabled={isSaving} onPress={() => updateOrder(item, 'reject')}>
                <Text style={styles.secondaryButtonText}>Reject</Text>
              </TouchableOpacity>
            </>
          ) : null}
          {item.status === 'confirmed' ? (
            <TouchableOpacity style={styles.primaryButton} disabled={isSaving} onPress={() => updateOrder(item, 'complete')}>
              <Text style={styles.primaryButtonText}>{isSaving ? 'Processing...' : 'Mark Completed'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load orders.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Artist Orders</Text>
      <View style={styles.tabRow}>
        {orderTabs.map((tab) => (
          <TouchableOpacity key={tab.id} style={[styles.tabItem, activeTab === tab.id && styles.tabActive]} onPress={() => setActiveTab(tab.id as any)}>
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        extraData={localStatusUpdates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found for this filter.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: '#4f46e5',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#1f2937',
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  detailButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
  },
  detailButtonText: {
    color: '#4338ca',
    fontWeight: '700',
  },
  invoiceButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  invoiceText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  actionGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4338ca',
    alignItems: 'center',
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#991b1b',
    fontWeight: '700',
  },
  emptyContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#4b5563',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 16,
  },
});
